import sys

with open("lib/crm/salesOrderService.ts", "r") as f:
    lines = f.readlines()

new_content = []
i = 0

while i < len(lines):
    line = lines[i]
    if "import { productWarehouseService } from \"@/lib/inventory/productWarehouseService\";" in line:
        new_content.append(line)
        new_content.append("import { calculateTotals } from \"./salesOrderCalculations\";\n")
        new_content.append("export { approveSalesOrder, reserveInventory, releaseReservation, cancelSalesOrder, closeSalesOrder } from \"./salesOrderWorkflow\";\n")
        i += 1
        continue
        
    if "export function calculateTotals" in line or "export async function approveSalesOrder" in line or "export async function reserveInventory" in line or "export async function releaseReservation" in line or "export async function cancelSalesOrder" in line or "export async function closeSalesOrder" in line:
        # Find previous JSDoc block
        start_idx = i
        while start_idx > 0 and ("/**" in lines[start_idx - 1] or " *" in lines[start_idx - 1] or " */" in lines[start_idx - 1]):
            start_idx -= 1
            
        # We need to remove the jsdoc that we might have already added to new_content
        lines_to_remove = i - start_idx
        for _ in range(lines_to_remove):
            if new_content:
                new_content.pop()
        
        # Skip function body
        open_braces = 0
        started = False
        while i < len(lines):
            open_braces += lines[i].count('{')
            open_braces -= lines[i].count('}')
            if '{' in lines[i]:
                started = True
            if started and open_braces == 0:
                i += 1
                break
            i += 1
        continue

    new_content.append(line)
    i += 1

with open("lib/crm/salesOrderService.ts", "w") as f:
    f.writelines(new_content)
