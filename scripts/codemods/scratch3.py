import sys

with open("app/erp/hr/employees/[id]/EmployeeProfileClient.tsx", "r") as f:
    lines = f.readlines()

# Ensure we import the components at the top
has_imports = any("import PersonalTab" in line for line in lines)
if not has_imports:
    for i, line in enumerate(lines):
        if "import { updateExtendedProfile, saveDocumentMetadata, saveNote } from \"./actions\";" in line:
            lines.insert(i + 1, "import PersonalTab from '../components/PersonalTab';\n")
            lines.insert(i + 2, "import EducationTab from '../components/EducationTab';\n")
            lines.insert(i + 3, "import ExperienceTab from '../components/ExperienceTab';\n")
            lines.insert(i + 4, "import FamilyTab from '../components/FamilyTab';\n")
            break

# Now find where the !isEditing block starts (line 228 approx)
start_idx = -1
for i, line in enumerate(lines):
    if "{!isEditing ? (" in line and "Profile Tab" in "".join(lines[i-4:i]):
        start_idx = i
        break

if start_idx != -1:
    end_idx = -1
    open_braces = 0
    # Find the closing brace of the !isEditing ? ( ... ) : ( ... )
    for i in range(start_idx, len(lines)):
        # Just look for the closing </form> and then )}
        if "</form>" in lines[i]:
            end_idx = i + 1
            break
    
    if end_idx != -1:
        replacement = """          {!isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <PersonalTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} getInitials={getInitials} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <EducationTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} handleAddEducation={handleAddEducation} handleRemoveEducation={handleRemoveEducation} handleEducationChange={handleEducationChange} />
                  <ExperienceTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} handleAddExperience={handleAddExperience} handleRemoveExperience={handleRemoveExperience} handleExperienceChange={handleExperienceChange} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <FamilyTab formData={formData} setFormData={setFormData} isEditing={false} employee={employee} handleProfileChange={handleProfileChange} />
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-6)' }}>
              <PersonalTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleProfileChange={handleProfileChange} getInitials={getInitials} />
              <EducationTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleAddEducation={handleAddEducation} handleRemoveEducation={handleRemoveEducation} handleEducationChange={handleEducationChange} />
              <ExperienceTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleAddExperience={handleAddExperience} handleRemoveExperience={handleRemoveExperience} handleExperienceChange={handleExperienceChange} />
              <FamilyTab formData={formData} setFormData={setFormData} isEditing={true} employee={employee} handleProfileChange={handleProfileChange} />
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--spacing-6)' }}>
                <button type="submit" className="btn btn-primary" disabled={isSaving}>
                  {isSaving ? "Saving Profile..." : "Save Profile"}
                </button>
              </div>
            </form>
"""
        
        # We replace lines from start_idx to end_idx with our replacement
        new_lines = lines[:start_idx] + [replacement] + lines[end_idx:]
        with open("app/erp/hr/employees/[id]/EmployeeProfileClient.tsx", "w") as f:
            f.writelines(new_lines)
            
print("Done")
