import * as lucide from 'lucide-react';
const icons = ['Home', 'Users', 'DollarSign', 'Box', 'Briefcase', 'CreditCard', 'Folder', 'BarChart2', 'Settings', 'Shield', 'Menu', 'Search', 'Bell', 'Moon', 'Sun', 'Monitor', 'ChevronRight', 'UserCircle'];
icons.forEach(i => {
  if (!lucide[i]) {
    console.error("Missing icon:", i);
  }
});
console.log("Check complete.");
