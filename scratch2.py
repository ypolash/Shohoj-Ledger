import sys

with open("app/erp/settings/attendance/page.tsx", "r") as f:
    lines = f.readlines()

new_content = []
i = 0

while i < len(lines):
    line = lines[i]
    if "import { PageHeader } from '@/components/layout/PageHeader/PageHeader';" in line:
        new_content.append(line)
        new_content.append("import NetworkModal from './components/NetworkModal';\n")
        new_content.append("import PunishmentRuleModal from './components/PunishmentRuleModal';\n")
        i += 1
        continue

    # Remove the inline modals
    if "{/* Network Modal */}" in line:
        # Stop here and add the new components instead
        new_content.append("      {/* Modals */}\n")
        new_content.append("      <NetworkModal\n")
        new_content.append("        isOpen={isModalOpen}\n")
        new_content.append("        onClose={handleCloseModal}\n")
        new_content.append("        onSave={handleSaveNetwork}\n")
        new_content.append("        editingNetwork={editingNetwork}\n")
        new_content.append("        name={name} setName={setName}\n")
        new_content.append("        ssid={ssid} setSsid={setSsid}\n")
        new_content.append("        bssid={bssid} setBssid={setBssid}\n")
        new_content.append("        ipAddress={ipAddress} setIpAddress={setIpAddress}\n")
        new_content.append("        isActive={isActive} setIsActive={setIsActive}\n")
        new_content.append("        error={error} saving={saving}\n")
        new_content.append("      />\n")
        new_content.append("      <PunishmentRuleModal\n")
        new_content.append("        isOpen={isRuleModalOpen}\n")
        new_content.append("        onClose={() => setIsRuleModalOpen(false)}\n")
        new_content.append("        onSave={saveRule}\n")
        new_content.append("        editingRule={editingRule}\n")
        new_content.append("        formData={formData}\n")
        new_content.append("        setFormData={setFormData}\n")
        new_content.append("      />\n")
        
        # Skip everything until </PageContainer>
        while i < len(lines) and "</PageContainer>" not in lines[i]:
            i += 1
        continue

    new_content.append(line)
    i += 1

with open("app/erp/settings/attendance/page.tsx", "w") as f:
    f.writelines(new_content)
