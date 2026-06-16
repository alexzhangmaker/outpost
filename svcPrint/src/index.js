const WordListTemplate = require('./word-list-template');
const path = require('path');

const OUTPUT_DIR = path.join(__dirname, '../output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'word-list.pdf');

// Mock Data
const words = [
    "Apple", "สวัสดี (Hello)", "Computer", "ขอบคุณ (Thanks)", "School", "โรงเรียน",
    "Banana", "Orange", "Elephant", "ช้าง", "Book", "หนังสือ",
    "Pencil", "ดินสอ", "Teacher", "ครู", "Student", "นักเรียน",
    "Water", "น้ำ", "Rice", "ข้าว", "Chicken", "ไก่",
    "Dog", "หมา", "Cat", "แมว", "Bird", "นก",
    "Fish", "ปลา", "Sun", "พระอาทิตย์", "Moon", "พระจันทร์",
    "Star", "ดาว", "Sky", "ท้องฟ้า", "Cloud", "เมฆ",
    "Rain", "ฝน", "Wind", "ลม", "Fire", "ไฟ",
    "Earth", "โลก", "Tree", "ต้นไม้", "Flower", "ดอกไม้",
    "River", "แม่น้ำ", "Mountain", "ภูเขา", "Sea", "ทะเล",
    "Love", "รัก", "Happy", "มีความสุข", "Sad", "เศร้า",
    "Angry", "โกรธ", "Hungry", "หิว", "Tired", "เหนื่อย",
    "Good", "ดี", "Bad", "เลว", "Big", "ใหญ่",
    "Small", "เล็ก", "Hot", "ร้อน", "Cold", "หนาว",
    "Fast", "เร็ว", "Slow", "ช้า", "New", "ใหม่",
    "Old", "เก่า", "Beautiful", "สวย", "Ugly", "น่าเกลียด"
];

// Generate more data to test pagination
const longList = [...words, ...words, ...words];

async function main() {
    console.log('Generating PDF...');

    const template = new WordListTemplate();
    template.generatePDF(longList);
    template.save(OUTPUT_FILE);
}

main().catch(console.error);
