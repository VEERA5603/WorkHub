const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('./User');
const { encodeText, initializeModel } = require("../routes/ai");
const MONGODB_URI = ''; 

const domains = {
  Plumbing: [
    "Over 7 years of experience handling residential and commercial plumbing issues including leak repairs, fixture installations, and pipe maintenance.",
    "Specialized in eco-friendly plumbing systems and water-saving installations. Experienced with modern bathrooms and kitchen pipe layouts.",
    "Skilled in troubleshooting complex plumbing systems in high-rise buildings, ensuring quick resolution with long-lasting results.",
    "Certified plumber with extensive work on municipal water systems, septic tanks, and emergency burst pipe response."
  ],
  "Electrical Work": [
    "Certified electrician with deep experience in rewiring homes, fixing fuse boxes, and setting up smart lighting systems.",
    "Handled commercial electric panels, industrial wiring and installation of energy-efficient systems for mid-size enterprises.",
    "Known for safe practices in high-voltage repair, transformer setup, and wiring diagnostics in old buildings.",
    "Skilled in inverter and solar panel installations with experience optimizing backup systems for homes and small businesses."
  ],
  "Device Installation": [
    "Professional in setting up smart TVs, home theaters, and kitchen appliances with attention to safety and user education.",
    "Experienced in IoT device installation, including smart locks, thermostats, and security systems with remote monitoring.",
    "Trained in configuring routers, CCTV systems, and Wi-Fi boosters for residential and small office use.",
    "Specialist in appliance integration for smart homes, including voice assistants and central hubs."
  ],
  Cleaning: [
    "5 years of experience offering deep-cleaning services for homes, post-construction sites, and commercial offices.",
    "Trained in eco-friendly cleaning solutions with an eye for detail in bathrooms, kitchens, and carpets.",
    "Experienced with equipment-based cleaning for large halls, floors, and glass panels in corporate environments.",
    "Focused on hygiene, using hospital-grade sanitizers, especially for pandemic-aware home and office disinfection."
  ],
  Gardening: [
    "Landscape specialist with expertise in garden layout planning, seasonal planting, and irrigation system setup.",
    "Experienced gardener handling vertical gardens, balcony plants, and aesthetic green spaces for apartments.",
    "Skilled in lawn care, soil health assessment, and organic composting techniques to keep gardens thriving.",
    "Passionate about medicinal and native plant gardens, with experience managing rooftop green spaces."
  ],
  Maintenance: [
    "All-rounder with skills in carpentry, plumbing, minor electricals, and furniture assembly for home maintenance.",
    "Managed property maintenance for residential complexes including generator upkeep and regular facility checks.",
    "Experienced in HVAC filter replacements, wall patching, and ceiling repairs with quick turnaround.",
    "Offers regular maintenance contracts, ensuring homes and offices remain in top condition throughout the year."
  ],
  "Mechanic Services": [
    "Vehicle mechanic with 10+ years of experience servicing cars, bikes, and light trucks. Specialist in engine diagnostics.",
    "Expert in servicing diesel engines, hydraulic systems, and industrial machinery for factories and farms.",
    "Trained in electric vehicle repair and battery maintenance. Quick turnaround on common breakdowns.",
    "Skilled at mobile repairs and emergency road assistance for two-wheelers and hatchbacks."
  ]
};

const indianNames = [
  'Ajay', 'Sunil', 'Ravi', 'Kiran', 'Suresh', 'Vijay', 'Rajesh', 'Manoj', 'Anil', 'Rahul',
  'Deepak', 'Amit', 'Arun', 'Prakash', 'Sanjay', 'Lokesh', 'Naresh', 'Ashok', 'Gopal', 'Ramesh'
];

const customerNames = [
  'Priya', 'Divya', 'Sneha', 'Kavya', 'Meena', 'Ritika', 'Lakshmi', 'Neha', 'Pooja', 'Ananya'
];
const adminNames = [
  'Ajayprasath'
];

const generateTechnicians = async () => {
  const technicians = [];
  const domainNames = Object.keys(domains);

  let count = 0;
  for (let domain of domainNames) {
    for (let i = 0; i < domains[domain].length; i++) {
      const name = indianNames[count % indianNames.length];  // ✅ Wrap around if count exceeds
      const email = `tech-${name.toLowerCase()}${count}@wh.com`; // ✅ Ensure unique email
      const password = await bcrypt.hash(`admin@123`, 10);
      const [embedding] = await encodeText([domains[domain][i]]);
      
      technicians.push({
        name,
        email,
        password,
        role: 'technician',
        description: domains[domain][i],
        domain,
        location: `City ${count + 1}`,
        phone: `90000000${(count + 1).toString().padStart(2, '0')}`,
        createdAt: new Date(),
        embedding
      });

      count++;
    }
  }

  return technicians;
};

const generateCustomers = async () => {
  const customers = [];

  for (let i = 0; i < 10; i++) {
    const name = customerNames[i];
    const email = `cust-${name}@wh.com`;
    const password = await bcrypt.hash(`admin@123`, 10);

    customers.push({
      name,
      email,
      password,
      role: 'customer',
      location: `Town ${i + 1}`,
      phone: `80000000${(i + 1).toString().padStart(2, '0')}`,
      createdAt: new Date()
    });
  }

  return customers;
};

const generateadmin = async () => {
  const admin = [];

  for (let i = 0; i < 1; i++) {
    const name = adminNames[i];
    const email = `ad-${name}@wh.com`;
    const password = await bcrypt.hash(`admin@123`, 10);

    admin.push({
      name,
      email,
      password,
      role: 'admin',
      location: `Town ${i + 1}`,
      phone: `80000000${(i + 1).toString().padStart(2, '0')}`,
      createdAt: new Date()
    });
  }

  return admin;
};

async function seedUsers() {
  try {
    // Initialize the AI model first
    await initializeModel();
    
    // Then connect to the database
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const technicians = await generateTechnicians();
    const customers = await generateCustomers();
    const admin = await generateadmin();
    
    const users = [...technicians, ...customers, ...admin];
    
    // Uncomment if you want to clear existing users first
    // await User.deleteMany({});
    
    await User.insertMany(users);
    console.log(`${users.length} users inserted successfully.`);
    
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (err) {
    console.error('Error seeding users:', err);
  }
}

seedUsers();