import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";


import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import UserApproval "user-approval/approval";

// migration with-clause

actor {
  // Mixin with role-based access control
  let accessControlState = AccessControl.initState();
  include MixinAuthorization(accessControlState);

  // Mixin for external blob storage
  include MixinStorage();

  // Approval state
  let approvalState = UserApproval.initState(accessControlState);

  // Should contain unique address for property
  public type Address = {
    city : Text;
    street : Text;
    blocknumber : Text;
    bluenumber : Text;
    country : Text;
    state : Text;
  };

  // Should contain precise address for area mapping
  public type Coordinates = {
    lat : Text;
    lang : Text;
  };

  public type Review = {
    propertyId : Nat;
    student : Principal;
    rating : Nat;
    comment : Text;
    timestamp : Time.Time;
  };

  // Should contain general property details
  public type Property = {
    id : Nat;
    owner : Principal;
    address : Address;
    coordinates : Coordinates;
    title : Text;
    description : Text;
    pricePerMonth : Nat;
    roomType : { #single; #sharedRoom; #apartment };
    amenities : [Text];
    photos : [Storage.ExternalBlob];
    approved : Bool;
    availableFrom : Time.Time;
    contactPhone : Text;
    genderPreference : { #boys; #girls; #unisex };
  };

  // Should contain property listing
  public type PropertyListing = {
    id : Text;
    owner : Principal;
    property : [Property];
    listingDate : Time.Time;
    status : { #active; #inactive };
  };

  public type Booking = {
    id : Nat;
    propertyId : Nat;
    student : Principal;
    startDate : Time.Time;
    endDate : Time.Time;
    status : { #pending; #paid; #cancelled; #rejected };
    stripeSessionId : ?Text;
    propertyIdText : Text;
    totalPrice : Nat;
    userDetails : {
      name : Text;
      phone : Text;
      email : Text;
    };
  };

  // Normal user details type
  public type UserProfile = {
    name : Text;
    phone : Text;
    email : Text;
    role : { #student; #owner; #admin };
  };

  // Store user profiles, properties, bookings, wishlists, and reviews
  let propertyList = Map.empty<Nat, Property>();
  let bookingList = Map.empty<Nat, Booking>();
  let profileList = Map.empty<Principal, UserProfile>();
  let wishlistMap = Map.empty<Principal, [Nat]>();
  let reviewMap = Map.empty<Nat, [Review]>();

  var nextPropertyId = 0;
  var nextBookingId = 0;

  // Stripe integration
  var configuration : ?Stripe.StripeConfiguration = null;

  public query func isStripeConfigured() : async Bool {
    configuration != null;
  };

  public shared ({ caller }) func setStripeConfiguration(config : Stripe.StripeConfiguration) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    configuration := ?config;
  };

  func getStripeConfiguration() : Stripe.StripeConfiguration {
    switch (configuration) {
      case (null) { Runtime.trap("Stripe needs to be first configured") };
      case (?value) { value };
    };
  };

  public shared ({ caller }) func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check session status");
    };
    // Additional check: verify the session belongs to a booking by this user or they are admin
    let userBookings = getUserBookingsInternal(caller);
    let hasAccess = userBookings.any<Booking>(func(b) {
      switch (b.stripeSessionId) {
        case (?sid) { sid == sessionId };
        case (null) { false };
      };
    }) or AccessControl.hasPermission(accessControlState, caller, #admin);

    if (not hasAccess) {
      Runtime.trap("Unauthorized: Can only check status of your own sessions");
    };

    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    await Stripe.createCheckoutSession(getStripeConfiguration(), caller, items, successUrl, cancelUrl, transform);
  };

  // Property management
  public shared ({ caller }) func listProperty(property : Property) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    let newProperty : Property = {
      property with
      id = nextPropertyId;
      owner = caller;
      approved = false;
    };
    propertyList.add(nextPropertyId, newProperty);
    nextPropertyId += 1;
  };

  public shared ({ caller }) func updateProperty(propertyId : Nat, property : Property) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    let oldProperty = switch (propertyList.get(propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?property) { property };
    };
    // Verify ownership unless admin
    if (oldProperty.owner != caller and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Can only update your own properties");
    };
    let newProperty : Property = {
      property with
      id = propertyId;
      approved = false;
      owner = oldProperty.owner;
    };
    propertyList.add(propertyId, newProperty);
  };

  public shared ({ caller }) func approveProperty(propertyId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let property = switch (propertyList.get(propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?property) { property };
    };
    let newProperty : Property = {
      property with
      approved = true;
    };
    propertyList.add(propertyId, newProperty);
  };

  public query ({ caller }) func getProperties() : async [Property] {
    // Admins can see all properties, others only see approved
    if (AccessControl.hasPermission(accessControlState, caller, #admin)) {
      propertyList.values().toArray();
    } else {
      let properties = propertyList.filter(func(_, prop) { prop.approved });
      properties.values().toArray();
    };
  };

  public query ({ caller }) func getApprovedProperties() : async [Property] {
    let properties = propertyList.filter(func(_, prop) { prop.approved });
    properties.values().toArray();
  };

  public query ({ caller }) func getProperty(id : Nat) : async ?Property {
    let property = propertyList.get(id);
    switch (property) {
      case (null) { null };
      case (?prop) {
        // Admins and owners can see unapproved properties, others only approved
        if (prop.approved or AccessControl.hasPermission(accessControlState, caller, #admin) or prop.owner == caller) {
          ?prop;
        } else {
          null;
        };
      };
    };
  };

  // Bookings
  public shared ({ caller }) func bookProperty(booking : Booking) : async () {
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    if (booking.startDate >= booking.endDate) {
      Runtime.trap("Invalid booking dates");
    };
    let property = switch (propertyList.get(booking.propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?property) { property };
    };
    let newBooking : Booking = {
      booking with
      id = nextBookingId;
      student = caller;
    };
    bookingList.add(nextBookingId, newBooking);
    nextBookingId += 1;
  };

  public query ({ caller }) func getBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all bookings");
    };
    bookingList.values().toArray();
  };

  public query ({ caller }) func getPropertyBookings(propertyId : Nat) : async [Booking] {
    // Verify caller is property owner or admin
    let property = switch (propertyList.get(propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?property) { property };
    };
    if (property.owner != caller and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Can only view bookings for your own properties");
    };
    let bookings = bookingList.filter(func(_, b) { b.propertyId == propertyId });
    bookings.values().toArray();
  };

  public query ({ caller }) func getUserBookings(user : Principal) : async [Booking] {
    // Verify caller is querying their own bookings or is admin
    if (caller != user and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Can only view your own bookings");
    };
    let bookings = bookingList.filter(func(_, b) { b.student == user });
    bookings.values().toArray();
  };

  func getUserBookingsInternal(user : Principal) : [Booking] {
    bookingList.filter(func(_, b) { b.student == user }).values().toArray();
  };

  // Profiles
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    profileList.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view profiles");
    };
    if (caller != user and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profileList.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can save profiles");
    };
    profileList.add(caller, profile);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Approvals
  public query ({ caller }) func isCallerApproved() : async Bool {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can check approval status");
    };
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    // admin guard in UserApproval
    UserApproval.setApproval(approvalState, user, status);
  };

  public shared ({ caller }) func requestApproval() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request approval");
    };
    UserApproval.requestApproval(approvalState, caller);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list approvals");
    };
    UserApproval.listApprovals(approvalState);
  };

  // Wishlist functions
  public shared ({ caller }) func addToWishlist(propertyId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage wishlist");
    };
    // Verify property exists
    switch (propertyList.get(propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?_) {};
    };

    let currentWishlist = switch (wishlistMap.get(caller)) {
      case (null) { [] };
      case (?list) { list };
    };

    // Check if already in wishlist
    if (currentWishlist.any<Nat>(func(id) { id == propertyId })) {
      return; // Already in wishlist, no-op
    };

    let newWishlist = currentWishlist.concat([propertyId]);
    wishlistMap.add(caller, newWishlist);
  };

  public shared ({ caller }) func removeFromWishlist(propertyId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can manage wishlist");
    };

    let currentWishlist = switch (wishlistMap.get(caller)) {
      case (null) { [] };
      case (?list) { list };
    };

    let newWishlist = currentWishlist.filter(func(id) { id != propertyId });
    wishlistMap.add(caller, newWishlist);
  };

  public query ({ caller }) func getWishlist() : async [Nat] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view wishlist");
    };

    switch (wishlistMap.get(caller)) {
      case (null) { [] };
      case (?list) { list };
    };
  };

  // Review functions
  public shared ({ caller }) func addReview(propertyId : Nat, rating : Nat, comment : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can submit reviews");
    };
    if (rating < 1 or rating > 5) {
      Runtime.trap("Rating must be between 1 and 5");
    };
    // Verify property exists
    switch (propertyList.get(propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?_) {};
    };

    let existingReviews = switch (reviewMap.get(propertyId)) {
      case (null) { [] };
      case (?reviews) { reviews };
    };

    let newReview : Review = {
      propertyId = propertyId;
      student = caller;
      rating = rating;
      comment = comment;
      timestamp = Time.now();
    };

    // Replace existing review by same student or append new
    let filteredReviews = existingReviews.filter(func(r : Review) : Bool { r.student != caller });
    let updatedReviews = filteredReviews.concat([newReview]);
    reviewMap.add(propertyId, updatedReviews);
  };

  public query func getReviews(propertyId : Nat) : async [Review] {
    switch (reviewMap.get(propertyId)) {
      case (null) { [] };
      case (?reviews) { reviews };
    };
  };

  public shared ({ caller }) func deleteReview(propertyId : Nat, reviewer : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can delete reviews");
    };

    let existingReviews = switch (reviewMap.get(propertyId)) {
      case (null) { [] };
      case (?reviews) { reviews };
    };

    let updatedReviews = existingReviews.filter(func(r : Review) : Bool { r.student != reviewer });
    reviewMap.add(propertyId, updatedReviews);
  };
};
