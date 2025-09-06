import { useState } from "react";
import ProfileSection from "../components/Profile/ProfileSection.tsx";
import PersonalInformations from "../components/Profile/PersonalInformations.tsx";

interface EditableFields {
  email: boolean;
  birthday: boolean;
  gender: boolean;
  phone: boolean;
}

interface Profile {
  name: string;
  email: string;
  birthday: string;
  gender: string;
  phone: string;
  editableFields: EditableFields;
}

export default function Setting() {
  const [profile, setProfile] = useState<Profile>({
    name: "W.Nethmi Perera",
    email: "maduka@gmail.com",
    birthday: "June 5, 2007",
    gender: "Female",
    phone: "+94 345 678 78",
    editableFields: {
      email: false,
      birthday: false,
      gender: false,
      phone: false,
    },
  });

  const handleToggleEdit = (field: keyof EditableFields) => {
    setProfile((prev) => ({
      ...prev,
      editableFields: {
        ...prev.editableFields,
        [field]: !prev.editableFields[field],
      },
    }));
  };

  const handleChange = (field: keyof Profile, value: string | EditableFields) => {
    setProfile((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // const handleSaveAll = () => {
  //   // ✅ Save logic here: maybe API call or localStorage
  //   console.log("Saved profile:", profile);
  //   alert("Profile details saved successfully!");
  // };

  return (
      <div className="max-w-3xl mx-auto p-4 bg-white rounded-lg shadow">
        {/* Profile Section */}
        <div className="pb-4 mb-4">
          <h3 className="text-xl font-roboto mb-2">Profile</h3>
          <p className="text-sm text-gray-500 mb-4">
            View and edit your personal profile information, including your name Profile Picture.
          </p>
          <ProfileSection />
        </div>

        {/* Personal Info */}
        <div>
          <h3 className="text-md font-roboto text-lg mb-2">Personal Information</h3>
          <p className="text-sm text-gray-500 mb-4">
            Manage your information details, including email address, date of birth, mobile number, gender.
          </p>
          <PersonalInformations
              profile={profile}
              onChange={handleChange}
              onToggleEdit={handleToggleEdit}
          />
        </div>

        {/* ✅ Save Button */}
        <div className="mt-6 text-right">
          {/*<button*/}
          {/*    onClick={handleSaveAll}*/}
          {/*    className="bg-teal-600 hover:bg-teal-700 text-white font-medium py-2 px-6 rounded"*/}
          {/*>*/}
          {/*  Save All Changes*/}
          {/*</button>*/}
        </div>
      </div>
  );
}
