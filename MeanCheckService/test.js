async function runTest() {
    const url = 'http://localhost:3001/evaluate';
    const tests = [
        {
            name: "Exact Match",
            body: { studentInput: "receive", standardMeanings: ["receive", "accept"] }
        },
        {
            name: "Typo with didyoumean Correction",
            body: { studentInput: "recieve", standardMeanings: ["receive", "accept"] }
        },
        {
            name: "Semantic Match (Bank example)",
            body: { studentInput: "financial institution", standardMeanings: ["bank", "river side"] }
        },
        {
            name: "Multi-meaning (Bank vs River)",
            body: { studentInput: "river bank", standardMeanings: ["bank", "river side"] }
        },
        {
            name: "Wrong meaning",
            body: { studentInput: "keyboard", standardMeanings: ["bank", "river side"] }
        }
    ];

    console.log("Starting MeanCheckService Tests...\n");

    for (const test of tests) {
        try {
            const resp = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(test.body)
            });
            const result = await resp.json();
            console.log(`Test: ${test.name}`);
            console.log(`Input: "${test.body.studentInput}" -> Corrected: "${result.correctedInput}"`);
            console.log(`Result: ${result.isCorrect ? '✅ CORRECT' : '❌ WRONG'} (Sim: ${result.similarity})`);
            console.log('---');
        } catch (err) {
            console.error(`Failed test ${test.name}:`, err.message);
        }
    }
}

runTest();
