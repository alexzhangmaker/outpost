
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
