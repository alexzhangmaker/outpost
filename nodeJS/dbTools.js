
const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

// Initialize Supabase client (assume environment variables are set)
const supabaseUrl = "https://yfftwweuxxkrzlvqilvc.supabase.co" ;
//using service_role secret key
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlmZnR3d2V1eHhrcnpsdnFpbHZjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjMyNjExMSwiZXhwIjoyMDY3OTAyMTExfQ.OGUGpfn3hyLLeOFSF5spGINFIw2Tr0dYvxUbdxJh0Xk";


const supabase = createClient(supabaseUrl, supabaseKey);


const cardTbl = 'sm2CardTbl' ;
const reviewListTbl = 'sm2ReviewListTbl' ;

// API: Add a new knowledge card
async function addCard(content = {}) {
    try {
      const cardId = uuidv4();
      const now = new Date().toISOString();
      const card = {
        id: cardId,
        interval: 0,
        repetition: 0,
        efactor: 2.5,
        next_review: now, // Immediate review for new
        content: content // Optional content field for card details*/
      };
  
      const { error } = await supabase
        .from(cardTbl)
        .insert([card]);
  
      if (error) {
        throw new Error(`Failed to add card: ${error.message} (code: ${error.code})`);
      }
      return { id: cardId, ...card };
    } catch (error) {
      throw new Error(`addCard error: ${error.message}`);
    }
}

// API: Delete a knowledge card by UUID
async function deleteCard(cardId) {
    const { data, error } = await supabase
    .from(cardTbl)
    .delete()
    .eq('id', cardId);

    if (error) throw error;
    return { deleted: cardId };
}

// API: Schedule a card based on UUID and review quality (0-5)
async function scheduleCard(cardId, quality) {
  if (typeof quality !== 'number' || quality < 0 || quality > 5) {
    throw new Error('Quality must be an integer between 0 and 5');
  }

  // Fetch the card from database
  let { data: card, error } = await supabase
    .from(cardTbl)
    .select('*')
    .eq('id', cardId)
    .single();

  if (error && error.code !== 'PGRST116') { // Handle not found separately
    throw error;
  }

  if (!card) {
    // New card: Initialize
    card = {
      id: cardId,
      interval: 0,
      repetition: 0,
      efactor: 2.5,
      next_review: new Date().toISOString() // Immediate review for new
    };
    const { error: insertError } = await supabase
      .from(cardTbl)
      .insert([card]);
    if (insertError) throw insertError;
  }

  // Apply Supermemo algorithm
  const updated = supermemo({
    interval: card.interval,
    repetition: card.repetition,
    efactor: card.efactor
  }, quality);

  // Calculate next review date
  const now = new Date();
  const nextReview = new Date(now);
  nextReview.setDate(now.getDate() + updated.interval);

  // Update database
  const { error: updateError } = await supabase
    .from(cardTbl)
    .update({
      interval: updated.interval,
      repetition: updated.repetition,
      efactor: updated.efactor,
      next_review: nextReview.toISOString()
    })
    .eq('id', cardId);

  if (updateError) throw updateError;

  // Return result
  return {
    interval: updated.interval,
    repetition: updated.repetition,
    efactor: updated.efactor,
    next_review: nextReview.toISOString()
  };
}

// API: Get due cards (UUIDs where next_review <= now)
async function getDueCards() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from(cardTbl)
    .select('id')
    .lte('next_review', now);

  if (error) throw error;
  return data.map(row => row.id);
}

// Function to create review list (scans due cards and stores in database)
async function createReviewList() {
  const dueCards = await getDueCards();
  const listId = uuidv4();
  const now = new Date().toISOString();

  const { error } = await supabase
    .from(reviewListTbl)
    .insert([{
      id: listId,
      created_at: now,
      due_cards: dueCards // Assuming due_cards is a json or array column
    }]);

  if (error) throw error;
  return { id: listId, created_at: now, due_cards: dueCards };
}



const noteFoldersTbl = 'noteFoldersTbl' ;

// API: Get due cards (UUIDs where next_review <= now)
async function listNoteFolders() {
    const now = new Date().toISOString();
    const {data:jsonFolders, error}  = await supabase.from(noteFoldersTbl).select('*');

    if (error) throw error;
    console.log(jsonFolders) ;
    return jsonFolders;
}


let jsonFolderTree=[
    {
        id:'680a31ab-cda1-4973-8ecb-788a7398ac4c',
        title:'闪念笔记'
    },{
        id:'06ef20f4-3c6a-435c-8b73-489c21a706b7',
        title:'文献笔记'
    },{
        id:'eb6bdaa8-0e3d-43e7-8ea8-527ffe321f7f',
        title:'语言学习',
        subFolders:[
            {
                id:'ae2c489d-7566-426d-bc65-1b2d95e27741',
                title:'泰语语法'
            },{
                id:'0fa0f803-dad0-42bb-9959-c0037472baf5',
                title:'英语语法'
            }
        ]
    },{
        id:'8026413c-d562-4d4a-93cb-f793727d71c4',
        title:'硬资产价值研究'
    },{
        id:'812cdb25-c393-4266-9863-14ec8e648a63',
        title:'计算机编程'
    }
] ;


// API: Add a new knowledge card
async function initNoteFolderTree(email,jsonFolderTree) {
    try {
        const { data, error } = await supabase.from('noteFolderTreeTbl')
        .insert([{ user_email: 'alexszhang@gmail.com', noteFolderTree: jsonFolderTree},]).select() ;

        if (error) {
            throw new Error(`Failed to initNoteFolderTree: ${error.message} (code: ${error.code})`);
        }
        return data;
    } catch (error) {
        throw new Error(`addCard error: ${error.message}`);
    }
}

async function fetchNoteFolderTree(email){
    try {
        let { data: noteFolderTreeTbl, error } = await supabase.from('noteFolderTreeTbl').select("*")
            .eq('user_email', email) ;
        if (error) {
            throw new Error(`Failed to fetchNoteFolderTree: ${error.message} (code: ${error.code})`);
        }
        return noteFolderTreeTbl;
    } catch (error) {
        throw new Error(`fetchNoteFolderTree error: ${error.message}`);
    }
}


async function addNote2Folder(documentID, folderID) {
    // Ensure UUIDs are valid
    if (!documentID || !folderID) {
      console.error('documentID and folderID are required');
      return { error: 'Missing required fields' };
    }
  
    const { data, error } = await supabase
      .from('document_FolderTbl')
      .upsert(
        [
          {
            documentID: documentID, // UUID for the document
            folderID: folderID, // UUID for the folder
          },
        ],
        {
          onConflict: 'documentID', // Specify the column to check for conflicts (primary key)
        }
      )
      .select(); // Return the inserted/updated row
  
    if (error) {
      console.error('Error during upsert:', error);
      return { error };
    }
  
    console.log('Upsert successful:', data);
    return { data };
}

async function notesInFolder(folderID){
    let { data, error } = await supabase.from('document_FolderTbl').select("documentID").eq('folderID', folderID) ;
    if(error) {
        throw new Error(`Failed to fetchNoteFolderTree: ${error.message} (code: ${error.code})`);
        return { error };
    }
    return data;
}

async function toolMain(){

    let jsonContent={
        kmID:uuidv4(),
        data:"this is demo"
    } ;
    //let jsonCard = await addCard(jsonContent) ;
    //console.log(jsonCard) ;

    //await deleteCard('95980720-7f06-4652-8011-bd44227fe7f2') ;
    //let ids = await getDueCards() ;
    //console.log(ids) ;

    //let jsonFolders = await listNoteFolders() ;
    //console.log(jsonFolders) ;

    //console.log(jsonFolderTree) ;
    //await initNoteFolderTree(jsonFolderTree) ;

    //let jsonRow = await fetchNoteFolderTree("alexszhang@gmail.com") ;
    //console.log(JSON.stringify(jsonRow,null,3)) ;

    let documentID = '17513397-de8e-4fd0-a10b-818d600947f2' ;
    let folderID = '680a31ab-cda1-4973-8ecb-788a7398ac4c';//'0fa0f803-dad0-42bb-9959-c0037472baf5' ;
    //let result = await addNote2Folder(documentID,folderID) ;

    let result = await notesInFolder(folderID) ;
    console.log(result) ;
}

toolMain() ;


/* 
Database Schema Assumption (create these tables in Supabase):
- cards: 
  id uuid primary key,
  interval integer default 0,
  repetition integer default 0,
  efactor real default 2.5,
  next_review timestamp

- review_lists:
  id uuid primary key,
  created_at timestamp,
  due_cards jsonb (or array if supported)
  
Note: SM18 is proprietary; this uses SM2 as an approximation based on Ebbinghaus and early Supermemo.
For full SM18, a licensed implementation would be needed.
*/
