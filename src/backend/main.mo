import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import Array "mo:core/Array";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import Principal "mo:core/Principal";
import Iter "mo:core/Iter";
import Set "mo:core/Set";
import Migration "migration";
import AccessControl "authorization/access-control";
import MixinAuthorization "authorization/MixinAuthorization";
import Stripe "stripe/stripe";
import OutCall "http-outcalls/outcall";
import MixinStorage "blob-storage/Mixin";
import Storage "blob-storage/Storage";
import UserApproval "user-approval/approval";

(with migration = Migration.run)
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
    verified : Bool;
    viewCount : Nat;
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

  var nextPropertyId = 0;
  var nextBookingId = 0;
  var nextReportId = 0;
  var nextAnnouncementId = 0;

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

  let inquiriesList = Map.empty<Nat, Inquiry>();
  var nextInquiryId = 0;

  // Notification type
  public type Notification = {
    id : Nat;
    ownerPrincipal : Principal;
    message : Text;
    timestamp : Time.Time;
    isRead : Bool;
    relatedInquiryId : ?Nat;
  };

  let notificationsList = Map.empty<Nat, Notification>();
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
};
