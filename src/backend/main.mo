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

  public type Rating = {
    user : Principal;
    propertyId : Nat;
    rating : Nat;
    feedback : Nat;
    comment : Text;
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

  // Store user profiles, properties, and bookings
  let propertyList = Map.empty<Nat, Property>();
  let bookingList = Map.empty<Nat, Booking>();
  let profileList = Map.empty<Principal, UserProfile>();

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

  public func getStripeSessionStatus(sessionId : Text) : async Stripe.StripeSessionStatus {
    await Stripe.getSessionStatus(getStripeConfiguration(), sessionId, transform);
  };

  public shared ({ caller }) func createCheckoutSession(items : [Stripe.ShoppingItem], successUrl : Text, cancelUrl : Text) : async Text {
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
    propertyList.values().toArray();
  };

  public query ({ caller }) func getApprovedProperties() : async [Property] {
    let properties = propertyList.filter(func(_, prop) { prop.approved });
    properties.values().toArray();
  };

  public query ({ caller }) func getProperty(id : Nat) : async ?Property {
    propertyList.get(id);
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
      price = property.pricePerMonth;
    };
    bookingList.add(nextBookingId, newBooking);
    nextBookingId += 1;
  };

  public query ({ caller }) func getBookings() : async [Booking] {
    bookingList.values().toArray();
  };

  public query ({ caller }) func getPropertyBookings(propertyId : Nat) : async [Booking] {
    let bookings = bookingList.filter(func(_, b) { b.propertyId == propertyId });
    bookings.values().toArray();
  };

  public query ({ caller }) func getUserBookings(caller : Principal) : async [Booking] {
    let bookings = bookingList.filter(func(_, b) { b.student == caller });
    bookings.values().toArray();
  };

  func getUserBookingsInternal(caller : Principal) : [Booking] {
    bookingList.filter(func(_, b) { b.student == caller }).values().toArray();
  };

  // Profiles
  public query ({ caller }) func getCallerUserProfile() : async ?UserProfile {
    profileList.get(caller);
  };

  public query ({ caller }) func getUserProfile(user : Principal) : async ?UserProfile {
    if (caller != user and not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Can only view your own profile");
    };
    profileList.get(user);
  };

  public shared ({ caller }) func saveCallerUserProfile(profile : UserProfile) : async () {
    profileList.add(caller, profile);
  };

  public query func transform(input : OutCall.TransformationInput) : async OutCall.TransformationOutput {
    OutCall.transform(input);
  };

  // Approvals
  public query ({ caller }) func isCallerApproved() : async Bool {
    AccessControl.hasPermission(accessControlState, caller, #admin) or UserApproval.isApproved(approvalState, caller);
  };

  public shared ({ caller }) func setApproval(user : Principal, status : UserApproval.ApprovalStatus) : async () {
    // admin guard in UserApproval
    UserApproval.setApproval(approvalState, user, status);
  };

  public shared ({ caller }) func requestApproval() : async () {
    UserApproval.requestApproval(approvalState, caller);
  };

  public query ({ caller }) func listApprovals() : async [UserApproval.UserApprovalInfo] {
    if (not (AccessControl.hasPermission(accessControlState, caller, #admin))) {
      Runtime.trap("Unauthorized: Only admins can list approvals");
    };
    UserApproval.listApprovals(approvalState);
  };
};
