/** AICF review receiver. Deploy as Apps Script Web App: execute as Me, access Anyone.
 * Set script property REVIEW_KEY to a long random secret. Do not publish it in GitHub.
 * Sheet: https://docs.google.com/spreadsheets/d/1nNgnDiPkE3XDklFvW5Vfl2hxCwQfSSyiH6OJFjqhx74/edit
 */
const SPREADSHEET_ID='1nNgnDiPkE3XDklFvW5Vfl2hxCwQfSSyiH6OJFjqhx74';
const TAB='審査レビュー';
function doPost(e) {
  const lock=LockService.getScriptLock();lock.waitLock(20000);
  try {
    const p=JSON.parse(e.postData.contents);
    const key=PropertiesService.getScriptProperties().getProperty('REVIEW_KEY');
    if(!key || !p.key || p.key!==key) return output_({ok:false,error:'unauthorized'});
    if(!/^AICF-\d{4,}$/.test(p.id)) return output_({ok:false,error:'invalid id'});
    const sheet=SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(TAB);
    if(!sheet) throw Error('Tab missing: '+TAB);
    const last=sheet.getLastRow();
    const ids=last>1?sheet.getRange(2,1,last-1,1).getValues().flat():[];
    const found=ids.indexOf(p.id);
    const row=found>=0?found+2:last+1;
    const existing=found>=0?sheet.getRange(row,2,1,2).getValues()[0]:['',''];
    const review=typeof p.review==='string'?p.review.slice(0,20000):existing[0];
    const technical=typeof p.technical==='string'?p.technical.slice(0,20000):existing[1];
    sheet.getRange(row,1,1,5).setValues([[p.id,review,technical,new Date(),'保存済み']]);
    return output_({ok:true,id:p.id,row});
  }catch(err){return output_({ok:false,error:String(err)})}
  finally{lock.releaseLock()}
}
function output_(obj){return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON)}
