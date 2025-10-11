
const _funcDict_WordSet = (parameter) => {
    alert("_funcDict_WordSet: " + parameter);
};

const _funcDict_PubAnki = async (rowCells) => {
    console.log(rowCells) ;
    let wordSetKey = rowCells[0].data ;
    console.log(wordSetKey) ;
    let l1Title = rowCells[3].data ;
    await _PublishWordSet2Anki(wordSetKey,l1Title) ;
};

async function _PublishWordSet2Anki(wordSetKey,title) {
    let keyEncode =encodeURIComponent(wordSetKey) ;
    let cDate = new Date() ;

    //let urlReviewSet = `https://outpost-dictionary-116208.asia-southeast1.firebasedatabase.app/thaiAnki/reviewSets/${keyEncode}.json`;
    let urlWordSet = `https://outpost-dictionary-116208.asia-southeast1.firebasedatabase.app/thaiWordList/${keyEncode}.json` ;
    let jsonReviewSet={
        "createdAt":cDate.toDateString(),
        "nextReview":cDate.toDateString(),
        "wordSetID":wordSetKey,
        "title":title,//wordSetKey,
        "wordSetURL":urlWordSet
    };
    // 在实际应用中，这里应该调用Firebase的发布API

    console.log(`发布项目: ${wordSetKey}`);
    /*
    await fetch(urlReviewSet, {
        method: "PUT", // Use PATCH to update specific fields
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(jsonReviewSet),
    }) ;
    */

    const reviewRef = gDatabase.ref(`thaiAnki/reviewSets/${keyEncode}`);
    await reviewRef.set(jsonReviewSet) ;
    alert(`已发布: ${wordSetKey}`);
}

const _funcDoAnki = async (rowCells) => {

    let reviewKey = rowCells[0].data ;
    console.log(reviewKey) ;
    //alert('will _funcDoAnki') ;
    let urlAnki=`http://localhost:3010/ankiAnywhereV2.html?reviewSet=${reviewKey}` ;
    window.open(urlAnki,"_blank") ;
}

/*
const _funcDoQuiz_001223 = async (rowCells) => {
    let UnitKey = rowCells[1].data ;
    let QuizKey = rowCells[0].data ;
    let QuizPath = `/${UnitKey}/${QuizKey}`
    console.log(QuizPath) ;
    let urlQuiz=`http://localhost:3010/quizAnywhereV2.html?quiz=001223${QuizPath}` ;
    window.open(urlQuiz,"_blank") ;
}

const _funcDoQuiz_025233 = async (rowCells) => {
    let QuizKey = rowCells[0].data ;
    console.log(QuizKey) ;
    let urlQuiz=`http://localhost:3010/quizAnywhereV2.html?quiz=025233/${QuizKey}` ;
    window.open(urlQuiz,"_blank") ;
}
*/

const modalCallConfirm_DictWL = async (formData) => {
    if(gDatabase==null)return ;

    let cKey = formData.key ;
    console.log("表单已确认, 接收到的数据:", formData);
    const ref = gDatabase.ref(`/thaiWordList/${formData.key}`);
    // Write data
    delete formData.key ;
    console.log(formData) ;
    ref.set(formData).then(() => {
        console.log('Data written successfully');
    }).catch((error) => {
        console.error('Error writing data:', error);
    });

    let cDate = new Date() ;
    let DateString = `${cDate.getFullYear()}${cDate.getMonth()+1}${cDate.getDate()}_${cDate.getTime()}` ;
    let urlTask = `https://outpost-asks-116208-c86c2-217ba.asia-southeast1.firebasedatabase.app/tasks/${DateString}.json` ;
    formData["Course"]="tdb" ;
    formData["taskStatus"]="pending" ;
    formData["wordSetID"]=`${cKey}` ;
    let putResponse = await fetch(urlTask, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
    });

    alert("数据已提交，请查看控制台！");
} ;

/*
const actionTbl={
    "dbThaiDictionary":{
        "/thaiWordList":{
            actionEdit:_funcDict_WordSet,
            actionDelete:_funcDict_WordSet,
            actionClick:_funcDict_PubAnki
        },
        "/thaiAnki/reviewSets":{
            actionEdit:_funcDict_WordSet,
            actionDelete:_funcDict_WordSet,
            actionClick:_funcDoAnki
        }
    },
    "dbOutpostQuiz":{
        "/001223":{
            actionClick:_funcDoQuiz_001223
        },
        "/025233":{
            actionClick:_funcDoQuiz_025233
        }
    }
};

const tblModalSchema={
    "dbThaiDictionary":{
        "/thaiWordList":{
            "schema":[
                {"name":"key","type":"string"},
                {"name":"words","type":"array"},
                {"name":"大类title","type":"string"},
                {"name":"分类title","type":"string"},
                {"name":"级别","type":"string"}
            ],
            "callback":{
                onConfirm: async (formData) => {
                    if(gDatabase==null)return ;

                    let cKey = formData.key ;
                    console.log("表单已确认, 接收到的数据:", formData);
                    const ref = gDatabase.ref(`/thaiWordList/${formData.key}`);
                    // Write data
                    delete formData.key ;
                    console.log(formData) ;
                    ref.set(formData).then(() => {
                        console.log('Data written successfully');
                    }).catch((error) => {
                        console.error('Error writing data:', error);
                    });

                    let cDate = new Date() ;
                    let DateString = `${cDate.getFullYear()}${cDate.getMonth()+1}${cDate.getDate()}_${cDate.getTime()}` ;
                    let urlTask = `https://outpost-asks-116208-c86c2-217ba.asia-southeast1.firebasedatabase.app/tasks/${DateString}.json` ;
                    formData["Course"]="tdb" ;
                    formData["taskStatus"]="pending" ;
                    formData["wordSetID"]=`${cKey}` ;
                    let putResponse = await fetch(urlTask, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(formData)
                    });

                    alert("数据已提交，请查看控制台！");
                },
                onCancel: () => {
                    console.log("用户取消了操作。");
                }
            }
        },
        "/thaiAnki/reviewSets":{
            "schema":[
                {"name":"key","type":"string"},
                {"name":"words","type":"array"},
                {"name":"大类title","type":"string"},
                {"name":"分类title","type":"string"},
                {"name":"级别","type":"string"}
            ],
            "callback":{
                onConfirm: async (formData) => {
                    if(gDatabase==null)return ;

                    alert("/thaiAnki/reviewSets 数据已提交，请查看控制台！");
                },
                onCancel: () => {
                    console.log("用户取消了操作。");
                }
            }
        }
    }
} ;
*/

/*
const dbTbls={
    "dbThaiDictionary":[
        {
            "title":"字典表",
            "dbPath":"/thaiDictionary"
        },{
            "title":"单词集",
            "dbPath":"/thaiWordList"
        },{
            "title":"Anki Decks",
            "dbPath":"/thaiAnki/reviewSets"
        }
    ],
    "dbOutpostTask":[],
    "dbThaiAudible":[],
    "dbOutpostQuiz":[
        {
            "title":"英语3测试",
            "dbPath":"/001223"
        },{
            "title":"泰语听说3测试",
            "dbPath":"/025233"
        }
    ]
} ;
*/
/*
const dbRender_Quiz_001223_En = (data,dbName,tblName)=>{
    console.log(`${dbName}==${tblName}`) ;

    let gridSchema = {
        columns:["Quiz","Unit","# Questions"],
        gridData:[]
    } ;

    let keys = Object.keys(data) ;
    for(let i=0;i<keys.length;i++){
        let jsonUnit = data[keys[i]] ;

        let quizKeys = Object.keys(jsonUnit) ;
        for(let j=0;j<quizKeys.length;j++){
            let jsonQuiz = jsonUnit[quizKeys[j]] ;
            let jsonQuizSchema={
                QuizTitle:quizKeys[j],
                QuizUnit:keys[i],
                Questions:jsonQuiz.length
            } ;
            gridSchema.gridData.push([jsonQuizSchema.QuizTitle,jsonQuizSchema.QuizUnit,jsonQuizSchema.Questions])
        }
    }
    return gridSchema ;
} ;

const dbRender_Quiz_025233_Th = (data,dbName,tblName)=>{
    console.log(`${dbName}==${tblName}`) ;
    let gridSchema = {
        columns:["Quiz","# Questions"],
        gridData:[]
    } ;
    let keys = Object.keys(data) ;
    for(let i=0;i<keys.length;i++){
        let jsonQuiz = data[keys[i]] ;
        let rowData = [keys[i],jsonQuiz.length] ;
        gridSchema.gridData.push(rowData) ;
    }
    return gridSchema ;
} ;

const dbTblRenders={
    "dbOutpostQuiz":{
            "/001223":dbRender_Quiz_001223_En,
            "/025233":dbRender_Quiz_025233_Th
    }
    
} ;
*/
