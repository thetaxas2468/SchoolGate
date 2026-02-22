const User = require('./models/User');
const Class = require('./models/Class');
const Student = require('./models/Student');
const Message = require('./models/Message'); // make sure you have a Message model

async function seedDatabase() {
  try {
    console.log('🧹 Clearing existing database data...');

    // Remove all existing data
    await Promise.all([
      User.deleteMany({}),
      Student.deleteMany({}),
      Class.deleteMany({}),
      Message.deleteMany({}), // delete all messages too
    ]);

    console.log('✅ Database cleared.');

    console.log('Seeding database with initial data...');

    // Create moderator
    const moderator = new User({
      name: 'المشرف الإداري',
      email: 'admin@school.com',
      password: 'admin123',
      role: 'moderator'
    });
    await moderator.save();

    // Create teachers
    const teacher1 = new User({ name: 'سارة محمد', email: 'sarah@school.com', password: 'teacher123', role: 'teacher' });
    const teacher2 = new User({ name: 'محمد علي', email: 'michael@school.com', password: 'teacher123', role: 'teacher' });
    await teacher1.save();
    await teacher2.save();

    // Create students
    const students = await Student.insertMany([
      { name: 'أحمد سامي' },
      { name: 'ليلى حسين' },
      { name: 'خالد يوسف' },
      { name: 'مريم عبد الله' },
      { name: 'سليم طارق' },
      { name: 'هند علي' },
    ]);

    // Create classes
    const class1 = new Class({
      name: 'الصف 10-أ',
      teacherId: teacher1._id,
      students: [students[0]._id, students[1]._id, students[2]._id]
    });
    const class2 = new Class({
      name: 'الصف 10-ب',
      teacherId: teacher2._id,
      students: [students[3]._id, students[4]._id, students[5]._id]
    });
    await class1.save();
    await class2.save();

    // Update student classIds
    await Promise.all([
      students[0].updateOne({ classId: class1._id }),
      students[1].updateOne({ classId: class1._id }),
      students[2].updateOne({ classId: class1._id }),
      students[3].updateOne({ classId: class2._id }),
      students[4].updateOne({ classId: class2._id }),
      students[5].updateOne({ classId: class2._id }),
    ]);

    // Update teacher assignments
    await teacher1.updateOne({ assignedClassId: class1._id });
    await teacher2.updateOne({ assignedClassId: class2._id });

    // Add example messages (teacher → moderator)
    await Message.insertMany([
  {
    teacherId: teacher1._id,
    studentId: students[0]._id,
    classId: class1._id,
    message: 'الطالب أحمد سامي سيغادر المدرسة الساعة 11:45 بناءً على طلب والديه',
    date: new Date(),
    time: '11:45'
  },
  {
    teacherId: teacher2._id,
    studentId: students[4]._id,
    classId: class2._id,
    message: 'الطالب سليم طارق يحتاج إذن خروج مبكر اليوم الساعة 12:00',
    date: new Date(),
    time: '12:00'
  }
]);

    console.log('✅ Database seeded successfully with users, classes, students, and example messages!');
    console.log('   Moderator: admin@school.com / admin123');
    console.log('   Teacher 1: sarah@school.com / teacher123 (الصف 10-أ)');
    console.log('   Teacher 2: michael@school.com / teacher123 (الصف 10-ب)');

  } catch (err) {
    console.error('خطأ أثناء التهيئة:', err);
  }
}

module.exports = { seedDatabase };