  // 模拟的文章数据JSON对象
let mockArticles = [
          {
          id: 'chiang-mai-trip-audible',
          title: "audible:清迈之旅 (A Trip to Chiang Mai)",
          paragraphs: [
              {
                  "paragraph_id": "p1",
                  "sentences": [
                  {
                      "thai": "เชียงใหม่เป็นเมืองที่สวยงามในภาคเหนือของประเทศไทย",
                      "english": "Chiang Mai is a beautiful city in northern Thailand.",
                      "sentence_id": "1766da6d-a4a3-43cb-b3c4-3a08c723c7fc",
                      "audioURI": "audio/1766da6d-a4a3-43cb-b3c4-3a08c723c7fc.wav"
                  },
                  {
                      "thai": "มีชื่อเสียงในด้านวัดวาอารามที่งดงาม ภูเขาเขียวชอุ่ม และวัฒนธรรมที่มีชีวิตชีวา",
                      "english": "It is famous for its beautiful temples, lush mountains, and vibrant culture.",
                      "sentence_id": "ab6037e9-3cd7-419e-80b1-567cc09cef29",
                      "audioURI": "audio/ab6037e9-3cd7-419e-80b1-567cc09cef29.wav"
                  }
                  ]
              },
              {
                  "paragraph_id": "p2",
                  "sentences": [
                  {
                      "thai": "นักท่องเที่ยวสามารถเยี่ยมชมดอยสุเทพซึ่งเป็นวัดที่มีชื่อเสียงบนภูเขา",
                      "english": "Tourists can visit Doi Suthep, a famous temple on the mountain.",
                      "sentence_id": "2316e34f-ae00-45cd-aa59-9975c9835a5f",
                      "audioURI": "audio/2316e34f-ae00-45cd-aa59-9975c9835a5f.wav"
                  },
                  {
                      "thai": "จากที่นั่น คุณสามารถมองเห็นทิวทัศน์ที่น่าทึ่งของเมืองได้",
                      "english": "From there, you can see amazing views of the city.",
                      "sentence_id": "098038ea-c514-45ff-8d61-79a647a1d027",
                      "audioURI": "audio/098038ea-c514-45ff-8d61-79a647a1d027.wav"
                  },
                  {
                      "thai": "ตลาดกลางคืนเป็นอีกหนึ่งสถานที่ที่น่าสนใจซึ่งคุณสามารถหาของที่ระลึกและอาหารท้องถิ่นได้",
                      "english": "The night bazaar is another interesting place where you can find souvenirs and local food.",
                      "sentence_id": "1b98318b-c3b0-4a57-9b47-0ac2cffb8dce",
                      "audioURI": "audio/1b98318b-c3b0-4a57-9b47-0ac2cffb8dce.wav"
                  }
                  ]
              },
              {
                  "paragraph_id": "p3",
                  "sentences": [
                  {
                      "thai": "อาหารในเชียงใหม่ก็อร่อยมาก",
                      "english": "The food in Chiang Mai is also very delicious.",
                      "sentence_id": "46a8dee7-543f-44e0-860d-a3eed36e6d80",
                      "audioURI": "audio/46a8dee7-543f-44e0-860d-a3eed36e6d80.wav"
                  },
                  {
                      "thai": "อย่าลืมลองข้าวซอย ซึ่งเป็นเมนูขึ้นชื่อของท้องถิ่น",
                      "english": "Don't forget to try Khao Soi, a famous local dish.",
                      "sentence_id": "d91f9b58-746f-4630-b1eb-c5d7bd005fa3",
                      "audioURI": "audio/d91f9b58-746f-4630-b1eb-c5d7bd005fa3.wav"
                  }
                  ]
              },
              {
                  "paragraph_id": "p4",
                  "sentences": [
                  {
                      "thai": "การเดินทางในเมืองนั้นง่ายดายด้วยรถตุ๊กตุ๊กและรถสองแถว",
                      "english": "Getting around the city is easy with tuk-tuks and songthaews.",
                      "sentence_id": "9ff8f3b9-4537-4dc9-8ae5-84bbd1d0d2c1",
                      "audioURI": "audio/9ff8f3b9-4537-4dc9-8ae5-84bbd1d0d2c1.wav"
                  },
                  {
                      "thai": "ผู้คนในท้องถิ่นเป็นมิตรและให้การต้อนรับเป็นอย่างดี",
                      "english": "The local people are friendly and welcoming.",
                      "sentence_id": "805e7245-14a3-490e-ab88-4acbb8fbcc4a",
                      "audioURI": "audio/805e7245-14a3-490e-ab88-4acbb8fbcc4a.wav"
                  }
                  ]
              },
              {
                  "paragraph_id": "p5",
                  "sentences": [
                  {
                      "thai": "โดยรวมแล้ว เชียงใหม่เป็นสถานที่ที่ยอดเยี่ยมสำหรับการพักผ่อนและสัมผัสกับวัฒนธรรมไทย",
                      "english": "Overall, Chiang Mai is a great place to relax and experience Thai culture.",
                      "sentence_id": "1bac3064-ab02-48f7-87fe-5ef62d18851b",
                      "audioURI": "audio/1bac3064-ab02-48f7-87fe-5ef62d18851b.wav"
                  }
                  ]
              }
          ]
      },

      
      {
          id: 'bangkok-city',
          title: '曼谷：天使之城 (Bangkok: City of Angels)',
          paragraphs: [
              {
                  pid: 0,
                  sentences: [
                      { thai: "กรุงเทพฯ เป็นเมืองหลวงและเมืองที่มีประชากรมากที่สุดของประเทศไทย", english: "Bangkok is the capital and most populous city of Thailand." },
                      { thai: "เป็นที่รู้จักกันในชื่อท้องถิ่นว่ากรุงเทพมหานคร", english: "It is known in Thai as Krung Thep Maha Nakhon." }
                  ]
              },
              {
                  pid: 1,
                  sentences: [
                      { thai: "เมืองนี้มีชื่อเสียงด้านชีวิตชีวาบนท้องถนนและศาลเจ้าทางวัฒนธรรม", english: "The city is famous for its vibrant street life and cultural landmarks." },
                      { thai: "วัดอรุณและพระบรมมหาราชวังเป็นสถานที่ท่องเที่ยวที่ต้องไปเยือน", english: "Wat Arun and the Grand Palace are must-visit tourist spots." }
                  ]
              }
          ]
      },
      {
          uuid: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
          title: "Everyone has their own Everest to climb",
          paragraphs: [
{
  "paragraph_id": "p1",
  "sentences": [
    {
      "thai": "“ทุกคนมีเอเวอเรสต์เป็นของตัวเอง”",
      "english": "\"Everyone has their own Everest.\"",
      "sentence_id": "533660a1-d3f1-4bc6-acb3-977b7ef6276e",
      "audioURI": "audio/533660a1-d3f1-4bc6-acb3-977b7ef6276e.wav"
    },
    {
      "thai": "นี่เป็นคำที่ วานดา รุทคีเยวิช นักปีนเขาหญิงชาวโปแลนด์ และสตรีคนที่ 3 ของโลกที่สามารถพิชิตยอดเขาเอเวอเรสต์ เมื่อ พ.ศ. 2521 กล่าวเอาไว้",
      "english": "These were the words of Wanda Rutkiewicz, a Polish female climber and the third woman in the world to conquer Mount Everest in 1978.",
      "sentence_id": "f62af140-c05e-44dd-bdfb-b3e11891b873",
      "audioURI": "audio/f62af140-c05e-44dd-bdfb-b3e11891b873.wav"
    },
    {
      "thai": "เป็นประโยคเปรียบเทียบว่า ทุกคนต่างมีเป้าหมายยิ่งใหญ่",
      "english": "It is a metaphor that everyone has great goals.",
      "sentence_id": "78eccca3-5368-4c9a-8717-6ca248bccfa2",
      "audioURI": "audio/78eccca3-5368-4c9a-8717-6ca248bccfa2.wav"
    },
    {
      "thai": "สำหรับแพทย์หญิงวัย 35 ปี จาก จ.ขอนแก่น “เอเวอเรสต์” ของเธอ ไม่ได้แค่คำเปรียบเทียบ",
      "english": "For the 35-year-old female doctor from Khon Kaen province, her \"Everest\" was not just a metaphor.",
      "sentence_id": "de3572b1-55bf-4b18-a61d-ebdbfc8f1743",
      "audioURI": "audio/de3572b1-55bf-4b18-a61d-ebdbfc8f1743.wav"
    },
    {
      "thai": "แต่เป็นยอดเขาจริง ๆ ซึ่งเธอพิชิตสำเร็จเมื่อวันที่ 25 พ.ค. 2566 เวลา 8.15 น. ตามเวลาท้องถิ่น",
      "english": "It was an actual peak that she successfully conquered on May 25, 2023, at 8:15 AM local time.",
      "sentence_id": "5d8e99a6-336d-4571-bac5-e49b2f489729",
      "audioURI": "audio/5d8e99a6-336d-4571-bac5-e49b2f489729.wav"
    }
  ]
},
{
  "paragraph_id": "p2",
  "sentences": [
    {
      "thai": "“ฉันอยู่ที่จุดสูงที่สุดในโลกแล้ว ฉันทำให้พ่อภูมิใจแล้ว”",
      "english": "\"I am at the highest point in the world. I have made my father proud.\"",
      "sentence_id": "e5c212f7-395d-426b-ac91-e9ee46396c32",
      "audioURI": "audio/e5c212f7-395d-426b-ac91-e9ee46396c32.wav"
    },
    {
      "thai": "พญ.มัณฑนา ถวิไธสง บอกกับบีบีซีไทยถึงความรู้สึกตอนที่ได้สัมผัสยอดภูเขาสูงที่สุดในโลก ณ ความสูง 8,848 เมตร",
      "english": "Dr. Manthana Thawithaisong told BBC Thai about her feelings when she touched the summit of the world's highest mountain at an altitude of 8,848 meters.",
      "sentence_id": "5e68ab44-1643-4888-9a14-920812d2c6dc",
      "audioURI": "audio/5e68ab44-1643-4888-9a14-920812d2c6dc.wav"
    },
    {
      "thai": "แต่ความสำเร็จยิ่งใหญ่ที่เธอคนจะทำได้ มี “ราคา” มากมายที่ต้องจ่าย ไม่ว่าจะเป็น 8 ปีแห่งการฝึกซ้อม ต้องลาออกจากงาน เงินกว่า 3 ล้านบาทที่หยอดอมจากหยาดเหงื่อที่ตั้งใจหามาด้วยตนเอง และประตูสู่ความตายที่อยู่ใกล้ทุกขณะของอยู่บนหลังคาโลก",
      "english": "However, the great success she achieved came with many \"prices\" to pay, including 8 years of training, having to quit her job, over 3 million baht saved from her own hard-earned money, and the door to death being ever-present while on the roof of the world.",
      "sentence_id": "3b69a8fa-38ae-4877-8769-000d567760eb",
      "audioURI": "audio/3b69a8fa-38ae-4877-8769-000d567760eb.wav"
    }
  ]
},
{
  "paragraph_id": "p3",
  "sentences": [
    {
      "thai": "“เรารู้ว่าการเสี่ยงขึ้นวันนี้มันเป็นความเสี่ยง การเสียชีวิตอะ หรือหาย เป็นสิ่งที่เราต้องยอมรับได้”",
      "english": "\"We know that taking this risk today is a risk. Death or disappearance is something we must accept.\"",
      "sentence_id": "022f1683-5911-48c3-8b4c-7374aa18ded9",
      "audioURI": "audio/022f1683-5911-48c3-8b4c-7374aa18ded9.wav"
    },
    {
      "thai": "มัณฑนา กล่าวเสียงสั่น พร้อมน้ำตา และรอยน้ำตา ในการสัมภาษณ์กับสำนักข่าวต่างประเทศชั้นนำ ไม่ผ่าน",
      "english": "Manthana said with a trembling voice, tears, and tear stains during an interview with leading international news agencies, not getting through.",
      "sentence_id": "86481c42-5175-4645-91ff-4e32238ce238",
      "audioURI": "audio/86481c42-5175-4645-91ff-4e32238ce238.wav"
    }
  ]
},
{
  "paragraph_id": "p4",
  "sentences": [
    {
      "thai": "แพทย์หญิงก็เสียชีวิตหนึ่งชั่วโมงก่อนที่จะเสียชีวิตเพียงชั่วโมงกว่า",
      "english": "The female doctor also died one hour before she died just over an hour.",
      "sentence_id": "4ea147be-9d00-4370-9e68-9ca99e6f3bde",
      "audioURI": "audio/4ea147be-9d00-4370-9e68-9ca99e6f3bde.wav"
    },
    {
      "thai": "“มันไม่มีอะไรที่ไม่คุ้ม ต่อให้ตายก็คุ้ม” เธอกล่าว",
      "english": "\"There's nothing that's not worth it; even if I die, it's worth it,\" she said.",
      "sentence_id": "bd7df7ce-8c99-485a-a424-6f309a035ee5",
      "audioURI": "audio/bd7df7ce-8c99-485a-a424-6f309a035ee5.wav"
    }
  ]
}
],
          words: [
              { thai: "นักปีนเขา", definition: "(nák-bpiin-khǎo) mountaineer, climber. A person who climbs mountains as a sport or profession." },
              { thai: "พิชิต", definition: "(phí-chít) to conquer, to overcome. To successfully overcome a problem or weakness." },
              { thai: "ยอดเขา", definition: "(yâwt-khǎo) mountain peak, summit. The pointed top of a mountain." },
              { thai: "เปรียบเทียบ", definition: "(bprìap-thîap) to compare, metaphor. A figure of speech in which a word or phrase is applied to an object or action to which it is not literally applicable." },
              { thai: "หยาดเหงื่อ", definition: "(yàat-ngùea) sweat, hard work. A poetic way to refer to the effort and labor someone puts into their work." },
              { thai: "หลังคาโลก", definition: "(lǎng-khaa-lôok) roof of the world. A term often used to refer to the high-altitude regions of the Himalayas, especially Mount Everest." },
              { thai: "หิมะกัด", definition: "(hì-má-gàt) frostbite. Injury to body tissues caused by exposure to extreme cold." },
              { thai: "จิตวิญญาณ", definition: "(jìt-win-yaan) spirit, soul, spiritual. Relating to or affecting the human spirit or soul as opposed to material or physical things." }
          ]
      }
  ];
