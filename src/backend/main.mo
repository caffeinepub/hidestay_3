import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import List "mo:core/List";
import Option "mo:core/Option";

import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import UserApproval "user-approval/approval";

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
    roomType : PropertyType;
    amenities : [Text];
    photos : [Storage.ExternalBlob];
    approved : Bool;
    availableFrom : Time.Time;
    contactPhone : Text;
    genderPreference : GenderType;
    verified : Bool;
    viewCount : Nat;
  };

  public type PropertyType = {
    #single;
    #sharedRoom;
    #apartment;
  };

  public type GenderType = {
    #boys;
    #girls;
    #unisex;
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

  // Report/Complaint type
  public type Report = {
    id : Nat;
    reporterId : Principal;
    targetPropertyId : Nat;
    reason : Text;
    description : Text;
    status : { #pending; #resolved; #dismissed };
    timestamp : Time.Time;
    actionTaken : ?Text;
  };

  // Announcement type
  public type Announcement = {
    id : Nat;
    title : Text;
    message : Text;
    createdAt : Time.Time;
    expiresAt : ?Time.Time;
    isActive : Bool;
  };

  // Property view event
  public type PropertyViewEvent = {
    propertyId : Nat;
    viewer : Principal;
    timestamp : Time.Time;
  };

  // Inquiry type
  public type Inquiry = {
    id : Nat;
    propertyId : Nat;
    studentPrincipal : Principal;
    studentName : Text;
    studentPhone : Text;
    inquiryType : { #bookVisit; #contactOwner };
    status : { #pending; #accepted; #rejected };
    timestamp : Time.Time;
    message : Text;
  };

  // Notification type
  public type Notification = {
    id : Nat;
    ownerPrincipal : Principal;
    message : Text;
    timestamp : Time.Time;
    isRead : Bool;
    relatedInquiryId : ?Nat;
  };

  // NEW: Payout Request type
  public type PayoutRequest = {
    id : Nat;
    student : Principal;
    pointsRequested : Nat;
    status : { #pending; #approved; #rejected };
    timestamp : Time.Time;
    notes : ?Text;
  };

  // NEW: Coupon type
  public type Coupon = {
    id : Nat;
    code : Text;
    discountPercent : Nat;
    isActive : Bool;
    createdAt : Time.Time;
    maxUses : Nat;
    useCount : Nat;
    createdBy : Principal;
  };

  // Store user profiles, properties, bookings, wishlists, and reviews
  let propertyList = Map.empty<Nat, Property>();
  let bookingList = Map.empty<Nat, Booking>();
  let profileList = Map.empty<Principal, UserProfile>();
  let wishlistMap = Map.empty<Principal, [Nat]>();
  let reviewMap = Map.empty<Nat, [Review]>();
  let blockedUsers = Set.empty<Principal>();
  let reportList = Map.empty<Nat, Report>();
  let announcementList = Map.empty<Nat, Announcement>();
  let propertyViewEvents = Map.empty<Nat, [PropertyViewEvent]>();
  let dailyActiveUsers = Map.empty<Text, Set.Set<Principal>>();
  let inquiriesList = Map.empty<Nat, Inquiry>();
  let notificationsList = Map.empty<Nat, Notification>();

  // NEW: Referral system storage
  let referralCodeToOwner = Map.empty<Text, Principal>();
  let userReferralCode = Map.empty<Principal, Text>();
  let referralCount = Map.empty<Principal, Nat>();
  let hasAppliedReferral = Set.empty<Principal>();

  // NEW: Points/Rewards system storage
  let pointsMap = Map.empty<Principal, Nat>();
  let firstBookingDone = Set.empty<Principal>();
  let payoutRequests = Map.empty<Nat, PayoutRequest>();
  var nextPayoutId = 0;

  // NEW: Coupon system storage
  let couponMap = Map.empty<Text, Coupon>();
  let usedCoupons = Set.empty<Text>();
  var nextCouponId = 0;

  var nextPropertyId = 0;
  var nextBookingId = 0;
  var nextReportId = 0;
  var nextAnnouncementId = 0;
  var nextInquiryId = 0;
  var nextNotificationId = 0;

  // Stripe integration
  var configuration : ?Stripe.StripeConfiguration = null;

  func checkBlocked(caller : Principal) {
    if (blockedUsers.contains(caller)) {
      Runtime.trap("User is blocked from performing this action");
    };
  };

  // Helper function to get date string from timestamp
  func getDateString(timestamp : Time.Time) : Text {
    let seconds = timestamp / 1_000_000_000;
    let days = seconds / 86400;
    days.toText();
  };

  // Helper function to generate referral code from principal
  func generateReferralCode(principal : Principal) : Text {
    let principalText = principal.toText();
    let hash = Nat.fromNat32(principal.hash());
    "REF" # hash.toText();
  };

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
    let hasAccess = userBookings.any<Booking>(
      func(b) {
        switch (b.stripeSessionId) {
          case (?sid) { sid == sessionId };
          case (null) { false };
        };
      }
    ) or AccessControl.hasPermission(accessControlState, caller, #admin);

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
    checkBlocked(caller);
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can perform this action");
    };
    let newProperty : Property = {
      property with
      id = nextPropertyId;
      owner = caller;
      approved = false;
      verified = false;
      viewCount = 0;
    };
    propertyList.add(nextPropertyId, newProperty);
    nextPropertyId += 1;
  };

  public shared ({ caller }) func updateProperty(propertyId : Nat, property : Property) : async () {
    checkBlocked(caller);
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
      verified = oldProperty.verified;
      viewCount = oldProperty.viewCount;
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

  public shared ({ caller }) func verifyProperty(propertyId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    let property = switch (propertyList.get(propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?property) { property };
    };
    let newProperty : Property = {
      property with
      verified = true;
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

  public shared ({ caller }) func trackPropertyView(propertyId : Nat) : async () {
    // Any user (including guests) can track views
    let property = switch (propertyList.get(propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?property) { property };
    };

    // Increment view count
    let updatedProperty : Property = {
      property with
      viewCount = property.viewCount + 1;
    };
    propertyList.add(propertyId, updatedProperty);

    // Store view event
    let viewEvent : PropertyViewEvent = {
      propertyId = propertyId;
      viewer = caller;
      timestamp = Time.now();
    };

    let existingEvents = switch (propertyViewEvents.get(propertyId)) {
      case (null) { [] };
      case (?events) { events };
    };
    propertyViewEvents.add(propertyId, existingEvents.concat([viewEvent]));
  };

  // Bookings
  public shared ({ caller }) func bookProperty(booking : Booking) : async () {
    checkBlocked(caller);
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

    // Notify owner of new booking/visit request
    let notifMsg = if (booking.status == #pending) {
      "New visit booking request for your property: " # property.title
    } else {
      "New booking confirmed for your property: " # property.title
    };
    let notif : Notification = {
      id = nextNotificationId;
      ownerPrincipal = property.owner;
      message = notifMsg;
      timestamp = Time.now();
      isRead = false;
      relatedInquiryId = null;
    };
    notificationsList.add(nextNotificationId, notif);
    nextNotificationId += 1;
    nextBookingId += 1;
  };

  public query ({ caller }) func getBookings() : async [Booking] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all bookings");
    };
    bookingList.values().toArray();
  };

  public query ({ caller }) func getPropertyBookings(propertyId : Nat) : async [Booking] {
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

  public shared ({ caller }) func cancelBooking(bookingId : Nat) : async () {
    checkBlocked(caller);
    let booking = switch (bookingList.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?b) { b };
    };
    if (booking.student != caller and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Can only cancel your own bookings");
    };
    if (booking.status != #pending) {
      Runtime.trap("Only pending bookings can be cancelled");
    };
    let updated : Booking = { booking with status = #cancelled };
    bookingList.add(bookingId, updated);
  };

  public shared ({ caller }) func confirmBooking(bookingId : Nat) : async () {
    checkBlocked(caller);
    let booking = switch (bookingList.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?b) { b };
    };
    let property = switch (propertyList.get(booking.propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?p) { p };
    };
    if (property.owner != caller and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only property owner can confirm bookings");
    };
    if (booking.status != #pending) {
      Runtime.trap("Only pending bookings can be confirmed");
    };
    let updated : Booking = { booking with status = #paid };
    bookingList.add(bookingId, updated);
  };

  public shared ({ caller }) func rejectBooking(bookingId : Nat) : async () {
    checkBlocked(caller);
    let booking = switch (bookingList.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?b) { b };
    };
    let property = switch (propertyList.get(booking.propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?p) { p };
    };
    if (property.owner != caller and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Only property owner can reject bookings");
    };
    if (booking.status != #pending) {
      Runtime.trap("Only pending bookings can be rejected");
    };
    let updated : Booking = { booking with status = #rejected };
    bookingList.add(bookingId, updated);
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

    // NEW: Generate referral code when user saves profile (if not already generated)
    switch (userReferralCode.get(caller)) {
      case (null) {
        let code = generateReferralCode(caller);
        userReferralCode.add(caller, code);
        referralCodeToOwner.add(code, caller);
      };
      case (?_) { /* Already has a code */ };
    };
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
    checkBlocked(caller);
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
    checkBlocked(caller);
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
    checkBlocked(caller);
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

  // Inquiry functions
  public shared ({ caller }) func createInquiry(propertyId : Nat, studentName : Text, studentPhone : Text, inquiryType : { #bookVisit; #contactOwner }, message : Text) : async () {
    checkBlocked(caller);
    // Only approved users can create inquiry
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can create inquiries");
    };

    // Verify property exists
    let property = switch (propertyList.get(propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?property) { property };
    };

    // Create new inquiry
    let inquiry : Inquiry = {
      id = nextInquiryId;
      propertyId;
      studentPrincipal = caller;
      studentName;
      studentPhone;
      inquiryType;
      status = #pending; // New inquiries start as pending
      timestamp = Time.now();
      message;
    };
    inquiriesList.add(nextInquiryId, inquiry);

    // Create notification for property owner
    let notification : Notification = {
      id = nextNotificationId;
      ownerPrincipal = property.owner;
      message = "New inquiry for your property - " # debug_show(inquiryType);
      timestamp = Time.now();
      isRead = false;
      relatedInquiryId = ?nextInquiryId;
    };

    notificationsList.add(nextNotificationId, notification);

    // Increment counters
    nextInquiryId += 1;
    nextNotificationId += 1;
  };

  public query ({ caller }) func getOwnerInquiries() : async [Inquiry] {
    // Only authenticated users can view inquiries
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view inquiries");
    };

    // Return all inquiries for properties owned by caller (must be owner, not admin)
    let ownedProperties = propertyList.filter(func(_id, prop) { prop.owner == caller });
    let propertyIds = ownedProperties.keys().toArray();

    let inquiries = inquiriesList.filter(
      func(_id, inquiry) {
        /* Checks if any propertyId in propertyIds matches inquiry.propertyId */
        propertyIds.any<Nat>(func(id) { id == inquiry.propertyId });
      }
    );
    inquiries.values().toArray();
  };

  public shared ({ caller }) func updateInquiryStatus(inquiryId : Nat, status : { #accepted; #rejected }) : async () {
    let inquiry = switch (inquiriesList.get(inquiryId)) {
      case (null) { Runtime.trap("Inquiry not found") };
      case (?inquiry) { inquiry };
    };

    let property = switch (propertyList.get(inquiry.propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?property) { property };
    };

    // Only owner or admin can accept/reject inquiry
    if (property.owner != caller and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Can only update status of your own inquiries");
    };

    let updatedInquiry = { inquiry with status };
    inquiriesList.add(inquiryId, updatedInquiry);
  };

  public query ({ caller }) func getAllInquiries() : async [Inquiry] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all inquiries");
    };
    inquiriesList.values().toArray();
  };

  // Notification functions
  public query ({ caller }) func getOwnerNotifications() : async [Notification] {
    // Only authenticated users can view notifications
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notifications");
    };

    let notifications = notificationsList.filter(func(_, notification) { notification.ownerPrincipal == caller });
    notifications.values().toArray();
  };

  public shared ({ caller }) func markAllNotificationsRead() : async () {
    // Only authenticated users can mark notifications as read
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };

    let updates = notificationsList.map<Nat, Notification, Notification>(
      func(_id, notification) {
        if (notification.ownerPrincipal == caller and not notification.isRead) {
          { notification with isRead = true };
        } else { notification };
      }
    );
    notificationsList.clear();

    // Fix: Add all entries from updates back to notificationsList
    for ((key, value) in updates.entries()) {
      notificationsList.add(key, value);
    };
  };

  public shared ({ caller }) func markNotificationRead(notificationId : Nat) : async () {
    // Only authenticated users can mark notifications as read
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can mark notifications as read");
    };

    let notification = switch (notificationsList.get(notificationId)) {
      case (null) { return () };
      case (?notification) { notification };
    };

    // Verify the notification belongs to the caller
    if (notification.ownerPrincipal != caller) {
      Runtime.trap("Unauthorized: Can only mark your own notifications as read");
    };

    if (not notification.isRead) {
      notificationsList.add(notificationId, { notification with isRead = true });
    };
  };

  public query ({ caller }) func getUnreadNotificationCount() : async Nat {
    // Only authenticated users can get notification count
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view notification count");
    };

    let notifications = notificationsList.values().toArray();
    let filteredNotifications = notifications.filter(
      func(n) { n.ownerPrincipal == caller and not n.isRead }
    );
    filteredNotifications.size();
  };

  public shared ({ caller }) func deleteProperty(propertyId: Nat) : async () {
    let property = switch (propertyList.get(propertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?property) { property };
    };
    // Verify that only property owner or admin can delete property
    if (property.owner != caller and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Can only delete your own properties");
    };
    // Remove it from persistent storage
    propertyList.remove(propertyId);
  };

  // Block a user (admin only)
  public shared ({ caller }) func blockUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    blockedUsers.add(user);
  };

  // Unblock a user (admin only)
  public shared ({ caller }) func unblockUser(user : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can perform this action");
    };
    blockedUsers.remove(user);
  };

  // Check if a user is blocked
  public query func isUserBlocked(user : Principal) : async Bool {
    blockedUsers.contains(user);
  };

  // Report/Complaint system
  public shared ({ caller }) func submitReport(targetPropertyId : Nat, reason : Text, description : Text) : async () {
    checkBlocked(caller);
    if (not (UserApproval.isApproved(approvalState, caller) or AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only approved users can submit reports");
    };

    // Verify property exists
    switch (propertyList.get(targetPropertyId)) {
      case (null) { Runtime.trap("Property not found") };
      case (?_) {};
    };

    let report : Report = {
      id = nextReportId;
      reporterId = caller;
      targetPropertyId = targetPropertyId;
      reason = reason;
      description = description;
      status = #pending;
      timestamp = Time.now();
      actionTaken = null;
    };

    reportList.add(nextReportId, report);
    nextReportId += 1;
  };

  public query ({ caller }) func getReports() : async [Report] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view reports");
    };
    reportList.values().toArray();
  };

  public shared ({ caller }) func resolveReport(reportId : Nat, actionTaken : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can resolve reports");
    };

    let report = switch (reportList.get(reportId)) {
      case (null) { Runtime.trap("Report not found") };
      case (?report) { report };
    };

    let updatedReport : Report = {
      report with
      status = #resolved;
      actionTaken = ?actionTaken;
    };

    reportList.add(reportId, updatedReport);
  };

  public shared ({ caller }) func dismissReport(reportId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can dismiss reports");
    };

    let report = switch (reportList.get(reportId)) {
      case (null) { Runtime.trap("Report not found") };
      case (?report) { report };
    };

    let updatedReport : Report = {
      report with
      status = #dismissed;
    };

    reportList.add(reportId, updatedReport);
  };

  // Announcements system
  public shared ({ caller }) func createAnnouncement(title : Text, message : Text, expiresAt : ?Time.Time) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create announcements");
    };

    let announcement : Announcement = {
      id = nextAnnouncementId;
      title = title;
      message = message;
      createdAt = Time.now();
      expiresAt = expiresAt;
      isActive = true;
    };

    announcementList.add(nextAnnouncementId, announcement);
    nextAnnouncementId += 1;
  };

  public query func getActiveAnnouncements() : async [Announcement] {
    let now = Time.now();
    let announcements = announcementList.filter(
      func(_, announcement) {
        announcement.isActive and (
          switch (announcement.expiresAt) {
            case (null) { true };
            case (?expiry) { expiry > now };
          }
        )
      }
    );
    announcements.values().toArray();
  };

  public shared ({ caller }) func deactivateAnnouncement(announcementId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can deactivate announcements");
    };

    let announcement = switch (announcementList.get(announcementId)) {
      case (null) { Runtime.trap("Announcement not found") };
      case (?announcement) { announcement };
    };

    let updatedAnnouncement : Announcement = {
      announcement with
      isActive = false;
    };

    announcementList.add(announcementId, updatedAnnouncement);
  };

  // Analytics
  public query ({ caller }) func getAnalyticsSummary() : async {
    totalUsers : Nat;
    totalProperties : Nat;
    activeListings : Nat;
    pendingListings : Nat;
    totalBookings : Nat;
    totalInquiries : Nat;
    totalReports : Nat;
  } {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view analytics");
    };

    let totalUsers = profileList.size();
    let totalProperties = propertyList.size();
    let activeListings = propertyList.filter(func(_, prop) { prop.approved }).size();
    let pendingListings = propertyList.filter(func(_, prop) { not prop.approved }).size();
    let totalBookings = bookingList.size();
    let totalInquiries = inquiriesList.size();
    let totalReports = reportList.size();

    {
      totalUsers = totalUsers;
      totalProperties = totalProperties;
      activeListings = activeListings;
      pendingListings = pendingListings;
      totalBookings = totalBookings;
      totalInquiries = totalInquiries;
      totalReports = totalReports;
    };
  };

  // Daily active users tracking
  public shared ({ caller }) func trackActivity() : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only authenticated users can track activity");
    };

    let today = getDateString(Time.now());
    let todayUsers = switch (dailyActiveUsers.get(today)) {
      case (null) { Set.empty<Principal>() };
      case (?users) { users };
    };

    todayUsers.add(caller);
    dailyActiveUsers.add(today, todayUsers);
  };

  public query ({ caller }) func getDailyActiveUserCounts() : async [{ date : Text; count : Nat }] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view daily active user counts");
    };

    let now = Time.now();
    let currentDay = getDateString(now);
    let currentDayNum = switch (Nat.fromText(currentDay)) {
      case (null) { 0 };
      case (?n) { n };
    };

    let result = Array.tabulate(
      30,
      func(i : Nat) : { date : Text; count : Nat } {
        let dayNum = switch (currentDayNum >= i) {
          case (true) { currentDayNum - i };
          case (false) { 0 };
        };
        let dateStr = dayNum.toText();
        let count = switch (dailyActiveUsers.get(dateStr)) {
          case (null) { 0 };
          case (?users) { users.size() };
        };
        { date = dateStr; count = count };
      }
    );

    result;
  };

  // Stripe payments via HTTP outcall
  public shared ({ caller }) func getStripePayments() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view Stripe payments");
    };

    let config = getStripeConfiguration();

    await OutCall.httpGetRequest(
      "https://api.stripe.com/v1/payment_intents?limit=20",
      [
        { name = "Authorization"; value = "Bearer " # config.secretKey },
      ],
      transform,
    );
  };

  // Confirm a paid booking after Stripe payment completes
  public shared ({ caller }) func confirmStripeBooking(bookingId : Nat, sessionId : Text) : async () {
    checkBlocked(caller);
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can confirm bookings");
    };

    let booking = switch (bookingList.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?b) { b };
    };

    // Only the student who made the booking can confirm
    if (booking.student != caller and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Can only confirm your own bookings");
    };

    // Only pending bookings can be confirmed this way
    if (booking.status != #pending) {
      return; // idempotent - already confirmed or cancelled
    };

    let updated : Booking = { booking with status = #paid; stripeSessionId = ?sessionId };
    bookingList.add(bookingId, updated);

    // Notify property owner
    let property = switch (propertyList.get(booking.propertyId)) {
      case (null) { return };
      case (?p) { p };
    };

    let notif : Notification = {
      id = nextNotificationId;
      ownerPrincipal = property.owner;
      message = "Payment received! Booking confirmed for your property: " # property.title;
      timestamp = Time.now();
      isRead = false;
      relatedInquiryId = null;
    };
    notificationsList.add(nextNotificationId, notif);
    nextNotificationId += 1;
  };

  // Cancel a paid booking and issue Stripe refund
  public shared ({ caller }) func cancelPaidBooking(bookingId : Nat) : async () {
    checkBlocked(caller);
    let booking = switch (bookingList.get(bookingId)) {
      case (null) { Runtime.trap("Booking not found") };
      case (?b) { b };
    };
    if (booking.student != caller and not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Can only cancel your own bookings");
    };
    if (booking.status != #paid) {
      Runtime.trap("Only paid bookings can be refunded via this method");
    };

    // Get the Stripe session to find the payment_intent
    let sessionId = switch (booking.stripeSessionId) {
      case (null) { Runtime.trap("No Stripe session ID found for this booking") };
      case (?sid) { sid };
    };

    let config = getStripeConfiguration();

    // Fetch session to get payment_intent
    let sessionResp = await OutCall.httpGetRequest(
      "https://api.stripe.com/v1/checkout/sessions/" # sessionId,
      [{ name = "Authorization"; value = "Bearer " # config.secretKey }],
      transform,
    );

    // Extract payment_intent from session response
    let paymentIntentId : Text = extractJsonField(sessionResp, "payment_intent");

    if (paymentIntentId.size() > 0) {
      // Issue refund
      let _refundResp = await OutCall.httpPostRequest(
        "https://api.stripe.com/v1/refunds",
        [{ name = "Authorization"; value = "Bearer " # config.secretKey }],
        "payment_intent=" # paymentIntentId,
        transform,
      );
    };

    // Mark booking as cancelled regardless of refund result
    let updated : Booking = { booking with status = #cancelled };
    bookingList.add(bookingId, updated);
  };

  // Helper to extract a string field value from simple JSON response
  func extractJsonField(json : Text, field : Text) : Text {
    let patterns = ["\"" # field # "\":\"", "\"" # field # "\": \""];
    for (pattern in patterns.values()) {
      if (json.contains(#text pattern)) {
        let parts = json.split(#text pattern);
        switch (parts.next()) {
          case (null) {};
          case (?_) {
            switch (parts.next()) {
              case (?afterPattern) {
                switch (afterPattern.split(#text "\"").next()) {
                  case (?value) {
                    if (value.size() > 0) {
                      return value;
                    };
                  };
                  case (_) {};
                };
              };
              case (null) {};
            };
          };
        };
      };
    };
    "";
  };

  // ========== NEW: REFERRAL SYSTEM ==========

  // Get or generate caller's referral code
  public query ({ caller }) func getReferralCode() : async Text {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can get referral codes");
    };

    switch (userReferralCode.get(caller)) {
      case (?code) { code };
      case (null) {
        // Generate code (will be saved when profile is saved)
        generateReferralCode(caller);
      };
    };
  };

  // Apply a referral code (new user only, once)
  public shared ({ caller }) func applyReferralCode(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can apply referral codes");
    };

    // Check if user has already applied a referral code
    if (hasAppliedReferral.contains(caller)) {
      Runtime.trap("You have already applied a referral code");
    };

    // Find the referrer
    let referrer = switch (referralCodeToOwner.get(code)) {
      case (null) { Runtime.trap("Invalid referral code") };
      case (?owner) { owner };
    };

    // Cannot refer yourself
    if (referrer == caller) {
      Runtime.trap("Cannot use your own referral code");
    };

    // Mark as applied
    hasAppliedReferral.add(caller);

    // Award 10 points to referrer
    let currentPoints = switch (pointsMap.get(referrer)) {
      case (null) { 0 };
      case (?points) { points };
    };
    pointsMap.add(referrer, currentPoints + 10);

    // Increment referral count
    let currentCount = switch (referralCount.get(referrer)) {
      case (null) { 0 };
      case (?count) { count };
    };
    referralCount.add(referrer, currentCount + 1);
  };

  // ========== NEW: POINTS/REWARDS SYSTEM ==========

  // Get caller's points balance
  public query ({ caller }) func getUserPoints() : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can view points");
    };

    switch (pointsMap.get(caller)) {
      case (null) { 0 };
      case (?points) { points };
    };
  };

  // Award first booking points (called when first paid booking happens)
  public shared ({ caller }) func awardFirstBookingPoints(student : Principal) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can award first booking points");
    };

    // Check if already awarded
    if (firstBookingDone.contains(student)) {
      return; // Already awarded
    };

    // Mark as done
    firstBookingDone.add(student);

    // Award 10 points
    let currentPoints = switch (pointsMap.get(student)) {
      case (null) { 0 };
      case (?points) { points };
    };
    pointsMap.add(student, currentPoints + 10);
  };

  // Request payout (student requests when >= 800 points)
  public shared ({ caller }) func requestPayout(notes : ?Text) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can request payouts");
    };

    let currentPoints = switch (pointsMap.get(caller)) {
      case (null) { 0 };
      case (?points) { points };
    };

    if (currentPoints < 800) {
      Runtime.trap("Insufficient points. Need at least 800 points to request payout");
    };

    // Deduct 800 points
    pointsMap.add(caller, currentPoints - 800);

    // Create payout request
    let request : PayoutRequest = {
      id = nextPayoutId;
      student = caller;
      pointsRequested = 800;
      status = #pending;
      timestamp = Time.now();
      notes = notes;
    };

    payoutRequests.add(nextPayoutId, request);
    let requestId = nextPayoutId;
    nextPayoutId += 1;

    requestId;
  };

  // Get all payout requests (admin only)
  public query ({ caller }) func getPayoutRequests() : async [PayoutRequest] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view payout requests");
    };

    payoutRequests.values().toArray();
  };

  // Approve payout request (admin only)
  public shared ({ caller }) func approvePayoutRequest(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can approve payout requests");
    };

    let request = switch (payoutRequests.get(requestId)) {
      case (null) { Runtime.trap("Payout request not found") };
      case (?req) { req };
    };

    if (request.status != #pending) {
      Runtime.trap("Only pending payout requests can be approved");
    };

    let updated : PayoutRequest = {
      request with
      status = #approved;
    };

    payoutRequests.add(requestId, updated);
  };

  // Reject payout request and restore points (admin only)
  public shared ({ caller }) func rejectPayoutRequest(requestId : Nat) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can reject payout requests");
    };

    let request = switch (payoutRequests.get(requestId)) {
      case (null) { Runtime.trap("Payout request not found") };
      case (?req) { req };
    };

    if (request.status != #pending) {
      Runtime.trap("Only pending payout requests can be rejected");
    };

    // Restore 800 points to student
    let currentPoints = switch (pointsMap.get(request.student)) {
      case (null) { 0 };
      case (?points) { points };
    };
    pointsMap.add(request.student, currentPoints + 800);

    // Mark as rejected
    let updated : PayoutRequest = {
      request with
      status = #rejected;
    };

    payoutRequests.add(requestId, updated);
  };

  // ========== NEW: COUPON SYSTEM ==========

  // Create coupon (admin only)
  public shared ({ caller }) func createCoupon(code : Text, maxUses : Nat) : async Nat {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can create coupons");
    };

    // Check if code already exists
    switch (couponMap.get(code)) {
      case (?_) { Runtime.trap("Coupon code already exists") };
      case (null) {};
    };

    let coupon : Coupon = {
      id = nextCouponId;
      code = code;
      discountPercent = 10;
      isActive = true;
      createdAt = Time.now();
      maxUses = maxUses;
      useCount = 0;
      createdBy = caller;
    };

    couponMap.add(code, coupon);
    let couponId = nextCouponId;
    nextCouponId += 1;

    couponId;
  };

  // Get all coupons (admin only)
  public query ({ caller }) func getCoupons() : async [Coupon] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can view all coupons");
    };

    couponMap.values().toArray();
  };

  // Validate coupon (query, returns coupon if valid for caller)
  public query ({ caller }) func validateCoupon(code : Text) : async ?Coupon {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can validate coupons");
    };

    let coupon = switch (couponMap.get(code)) {
      case (null) { return null };
      case (?c) { c };
    };

    // Check if active
    if (not coupon.isActive) {
      return null;
    };

    // Check if max uses exceeded (0 = unlimited)
    if (coupon.maxUses > 0 and coupon.useCount >= coupon.maxUses) {
      return null;
    };

    // Check if caller has already used this coupon
    let usageKey = caller.toText() # ":" # code;
    if (usedCoupons.contains(usageKey)) {
      return null;
    };

    ?coupon;
  };

  // Use coupon (marks as used by caller, increments use count)
  public shared ({ caller }) func useCoupon(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #user))) {
      Runtime.trap("Unauthorized: Only users can use coupons");
    };

    let coupon = switch (couponMap.get(code)) {
      case (null) { Runtime.trap("Coupon not found") };
      case (?c) { c };
    };

    // Check if active
    if (not coupon.isActive) {
      Runtime.trap("Coupon is not active");
    };

    // Check if max uses exceeded
    if (coupon.maxUses > 0 and coupon.useCount >= coupon.maxUses) {
      Runtime.trap("Coupon has reached maximum uses");
    };

    // Check if caller has already used this coupon
    let usageKey = caller.toText() # ":" # code;
    if (usedCoupons.contains(usageKey)) {
      Runtime.trap("You have already used this coupon");
    };

    // Mark as used
    usedCoupons.add(usageKey);

    // Increment use count
    let updated : Coupon = {
      coupon with
      useCount = coupon.useCount + 1;
    };
    couponMap.add(code, updated);
  };

  // Deactivate coupon (admin only)
  public shared ({ caller }) func deactivateCoupon(code : Text) : async () {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can deactivate coupons");
    };

    let coupon = switch (couponMap.get(code)) {
      case (null) { Runtime.trap("Coupon not found") };
      case (?c) { c };
    };

    let updated : Coupon = {
      coupon with
      isActive = false;
    };

    couponMap.add(code, updated);
  };
};
