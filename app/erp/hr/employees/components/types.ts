export interface EmployeeProfileFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  designation: string;
  department: string;
  basicSalary: string;
  status: string;
  employeeId: string;
  joinDate: string;
  location: string;
  profile: {
    dateOfBirth: string;
    gender: string;
    bloodGroup: string;
    nationalId: string;
    maritalStatus: string;
    photo: string;
    secondaryPhone: string;
    currentAddress: string;
    mainAddress: string;
    bankName: string;
    accountName: string;
    accountNumber: string;
    fatherName: string;
    motherName: string;
    spouseName: string;
    nomineeName: string;
    nomineeRelation: string;
    nomineePhoto: string;
    nomineeNid: string;
  };
  education: any[];
  experience: any[];
}

export interface TabProps {
  formData: EmployeeProfileFormData;
  setFormData: React.Dispatch<React.SetStateAction<EmployeeProfileFormData>>;
  isEditing: boolean;
  employee: any;
  handleProfileChange?: (field: string, value: any) => void;
  getInitials?: (f: string, l: string) => string;
}
