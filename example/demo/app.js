import MomentumPicker from 'momentum-picker';
import 'momentum-picker/style.css';

// DateTime Wheel Picker
const wheelDatetimePicker = new MomentumPicker({
  container: '#wheel-datetime-picker',
  mode: 'datetime',
  format: 'YYYY-MM-DD HH:mm',
  onConfirm: (date) => {
    console.log('DateTime Confirmed:', date);
    document.getElementById('wheel-datetime-output').textContent = `Selected: ${date.toLocaleString()}`;
  },
});
document.getElementById('wheel-datetime-picker').__picker = wheelDatetimePicker;

// Date Only Wheel Picker
const wheelDatePicker = new MomentumPicker({
  container: '#wheel-date-picker',
  mode: 'date',
  format: 'YYYY-MM-DD',
  onConfirm: (date) => {
    console.log('Date Confirmed:', date);
    document.getElementById('wheel-date-output').textContent = `Selected: ${date.toLocaleDateString()}`;
  },
});
document.getElementById('wheel-date-picker').__picker = wheelDatePicker;

// Time Only Wheel Picker
const wheelTimePicker = new MomentumPicker({
  container: '#wheel-time-picker',
  mode: 'time',
  format: 'HH:mm',
  onConfirm: (date) => {
    console.log('Time Confirmed:', date);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    document.getElementById('wheel-time-output').textContent = `Selected: ${hours}:${minutes}`;
  },
});
document.getElementById('wheel-time-picker').__picker = wheelTimePicker;

const inlinePicker = new MomentumPicker({
  container: '#inline-picker',
  mode: 'datetime',
  format: 'YYYY-MM-DD HH:mm',
  displayMode: 'inline',
  onConfirm: (date) => {
    console.log('Inline Confirmed:', date);
    document.getElementById('inline-output').textContent = `Selected: ${date.toLocaleString()}`;
  },
});

// Tab switching function
function switchTab(tabName) {
  // Hide all sections
  const sections = document.querySelectorAll('.demo-section');
  sections.forEach(section => {
    section.classList.remove('active');
  });

  // Remove active class from all tabs
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach(tab => {
    tab.classList.remove('active');
  });

  // Show selected section
  const selectedSection = document.getElementById(tabName);
  if (selectedSection) {
    selectedSection.classList.add('active');
  }

  // Add active class to clicked tab
  event.target.classList.add('active');
}

// Make functions globally available
window.switchTab = switchTab;
