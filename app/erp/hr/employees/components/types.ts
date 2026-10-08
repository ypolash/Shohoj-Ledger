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
  departmentId?: string;
  designationId?: string;
  employmentType?: string;
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
  formData: any;
  setFormData: React.Dispatch<React.SetStateAction<any>>;
  isEditing: boolean;
  employee: any;
  handleProfileChange?: (field: string, value: any) => void;
  getInitials?: (f: string, l: string) => string;
  handleAddEducation?: () => void;
  handleRemoveEducation?: (index: number) => void;
  handleEducationChange?: (index: number, field: string, value: any) => void;
  handleAddExperience?: () => void;
  handleRemoveExperience?: (index: number) => void;
  handleExperienceChange?: (index: number, field: string, value: any) => void;
}
