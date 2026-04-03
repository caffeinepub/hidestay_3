import Map "mo:core/Map";
import Nat "mo:core/Nat";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Storage "blob-storage/Storage";

module {
  type OldProperty = {
    id : Nat;
    owner : Principal;
    address : {
      city : Text;
      street : Text;
      blocknumber : Text;
      bluenumber : Text;
      country : Text;
      state : Text;
    };
    coordinates : {
      lat : Text;
      lang : Text;
    };
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

  type NewProperty = {
    id : Nat;
    owner : Principal;
    address : {
      city : Text;
      street : Text;
      blocknumber : Text;
      bluenumber : Text;
      country : Text;
      state : Text;
    };
    coordinates : {
      lat : Text;
      lang : Text;
    };
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

  public func run(old : { propertyList : Map.Map<Nat, OldProperty> }) : { propertyList : Map.Map<Nat, NewProperty> } {
    let newProperties = old.propertyList.map<Nat, OldProperty, NewProperty>(
      func(_id, oldProperty) {
        {
          oldProperty with
          verified = false;
          viewCount = 0;
        };
      }
    );
    { propertyList = newProperties };
  };
};
