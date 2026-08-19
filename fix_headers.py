import os
import re

directory = "/home/polash/Shohoj/Shohoj Ledger/app/api/crm"

for root, _, files in os.walk(directory):
    for file in files:
        if file.endswith(".ts"):
            filepath = os.path.join(root, file)
            with open(filepath, "r") as f:
                content = f.read()

            if "req.headers.get(\"x-company-id\")" in content:
                # Add import if missing
                if "getCompanyId" not in content:
                    content = content.replace("import { getSession } from \"@/lib/session\";", "import { getSession } from \"@/lib/session\";\nimport { getCompanyId } from \"@/lib/company/companyFilter\";")
                
                # Replace the usages
                content = content.replace("const companyId = req.headers.get(\"x-company-id\");", "const companyId = await getCompanyId();")
                
                with open(filepath, "w") as f:
                    f.write(content)
                print(f"Fixed {filepath}")
