const mockKMCards = [
    {
        "master_topic": "泰语量词 'ตัว'",
        "master_id": "classifier_thai_001",
        "metadata": {
            "subject": "内科学",
            "topic": "高血压",
            "difficulty": "hard",
            "tags": [
                "心血管",
                "诊断",
                "治疗"
            ]
        },
        "core_concept_card": {
            "question": "量词 'ตัว' 的万能钥匙是什么？（用一个核心特征来概括其绝大多数用法）",
            "answer": "「一个完整的、可被视作个体的形体。」",
            "summary": "核心是「形体」。从动物到家具，都符合此特征。"
        },
        "satellite_cards": [
            {
                "card_id": "satellite_animals",
                "aspect": "生物应用",
                "question": "哪些常见的生物使用 'ตัว'？昆虫可以用吗？",
                "answer": "哺乳动物、鸟类、鱼类、爬行动物等通常都用。昆虫通常也用，因为它是一个完整的生命个体。",
                "examples": [
                    "แมวหนึ่งตัว",
                    "นกหนึ่งตัว",
                    "ม้าหนึ่งตัว"
                ],
                "quizzes":[
                    {
                        "question":"What is the meaning of 'preserve'?",
                        "options":[
                            {"id":"A","text":"To keep something in its original state"},
                            {"id":"B","text":"To keep something in its original state"},
                            {"id":"C","text":"To keep something in its original state"},
                            {"id":"D","text":"To keep something in its original state"}
                        ],
                        "correct_answer":"A"
                    }
                ]
            },
            {
                "card_id": "satellite_objects",
                "aspect": "物品应用",
                "question": "列举三类可以使用 'ตัว' 的日常物品，并说明它们如何体现「形体」特征。",
                "answer": "1. 家具：椅子、桌子（有明确的物理结构）。2. 玩偶/机器人：被赋予了「个体」身份。3. 电器/设备：冰箱、电脑（被看作一个整体单元）。",
                "examples": [
                    "เก้าอี้หนึ่งตัว",
                    "ตุ๊กตาหนึ่งตัว",
                    "ตู้เย็นหนึ่งตัว"
                ]
            },
            {
                "card_id": "satellite_contrast",
                "aspect": "对比辨析",
                "question": "「一个轮胎」用 'ตัว'，而「一辆汽车」用 'คัน'。这说明了 'ตัว' 的什么局限性？",
                "answer": "说明 'ตัว' 常用于事物的「组成部分」或「个体」，而 'คัน' 用于完整的「交通工具」类别。'ตัว' 的「个体」尺度可大可小。",
                "common_mistakes": "不要用 'ตัว' 用于书、纸张（用 'เล่ม', 'แผ่น') 或液体。"
            }
        ]
    },
    {
        "card_id": "medicine_hypertension_01",
        "question": "根据最新指南，一名50岁糖尿病患者前来体检，其血压多次测量维持在142/92 mmHg。这属于哪种程度的高血压？首选的初始治疗策略是什么？",
        "answer": "属于1级高血压。首选初始策略是立即开始生活方式干预，并同时启动药物治疗（ACEI或ARB类药物优先考虑）。",
        "summary": "糖尿病患者发现1级高血压即应启动药物+生活方式联合治疗。",
        "metadata": {
            "subject": "内科学",
            "topic": "高血压",
            "difficulty": "hard",
            "tags": [
                "心血管",
                "诊断",
                "治疗"
            ]
        }
    },
    {
        "card_id": "thai_classifier_01",
        "question": "在泰语中，描述「一把椅子」、「一件衬衫」和「一只猫」时，有一个共同的量词。这个量词是什么？这反映了这些事物的什么共同特征？",
        "answer": "量词是 'ตัว'。共同特征是它们都具有一个清晰、完整的「形体」或「主体」。",
        "summary": "量词 'ตัว' 用于有完整形体的事物，包括动物、家具、衣服等。",
        "examples": [
            {
                "context": "动物",
                "content": "แมวหนึ่งตัว",
                "translation_or_note": "一只猫"
            },
            {
                "context": "家具",
                "content": "เก้าอี้หนึ่งตัว",
                "translation_or_note": "一把椅子"
            }
        ],
        "quizzes":[
            {
                "question":"What is the meaning of 'preserve'?",
                "options":[
                    {"id":"A","text":"To keep something in its original state"},
                    {"id":"B","text":"To keep something in its original state"},
                    {"id":"C","text":"To keep something in its original state"},
                    {"id":"D","text":"To keep something in its original state"}
                ],
                "correct_answer":"A"
            },
            {
                "question":"-----What is the meaning of 'preserve'?",
                "options":[
                    {"id":"A","text":"To keep something in its original state"},
                    {"id":"B","text":"To keep something in its original state"},
                    {"id":"C","text":"To keep something in its original state"},
                    {"id":"D","text":"To keep something in its original state"}
                ],
                "correct_answer":"B"
            }
        ],
        "metadata": {
            "subject": "泰语",
            "topic": "量词",
            "tags": [
                "语法",
                "基础"
            ]
        },
        "hints_and_connections": {
            "mnemonic": "'ตัว' 有『身体』的意思，想成『一个有身体的东西』就用它。",
            "common_mistakes": "不要用于书（应用 'เล่ม') 或车辆（应用 'คัน')。"
        }
    },
    {
        "card_id": "medicine_hypertension_01",
        "question": "根据最新指南，一名50岁糖尿病患者前来体检，其血压多次测量维持在142/92 mmHg。这属于哪种程度的高血压？首选的初始治疗策略是什么？",
        "answer": "属于1级高血压。首选初始策略是立即开始生活方式干预，并同时启动药物治疗（ACEI或ARB类药物优先考虑）。",
        "summary": "糖尿病患者发现1级高血压即应启动药物+生活方式联合治疗。",
        "metadata": {
            "subject": "内科学",
            "topic": "高血压",
            "difficulty": "hard",
            "tags": [
                "心血管",
                "诊断",
                "治疗"
            ]
        }
    }
];