// **************************** New Script By Fuad ********************************* //
var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
var CFhandleRow = 6;
var firstUserColumn = 7;
var firstContestRow = 13;

function myFunction(){
  Logger.log('test passed');
}

function onOpen(){
  var ui = SpreadsheetApp.getUi();
  ui.createMenu('Auto CF')
       .addItem('Update Contest', 'currentChosenContest')
       .addItem('Update User', 'currentChosenUser')
       .addToUi();

  ui.createMenu('Auto Vjudge')
       .addItem('Vjudge Update Contest', 'vjudgeChosenContest')
       //.addItem('Vjudge Update User', 'vjudgeChosenUser')
       .addToUi();
  Logger.log('Menu added');
}

function getSolveCount(url){
  var response = UrlFetchApp.fetch(url);
  Logger.log(response.getContentText());
  return JSON.parse(response);
}


// Codeforces data update for a contest

function currentChosenUser (){
  var col = currentChosenCellColumn()/2*2;
  var row = currentChosenCellRow();
  var userId = getCurrentUser(col);
  
  var Avals = sheet.getRange("A"+firstContestRow+":A").getValues();
  var Alast = Avals.filter(String).length;
  
  var totalMismatch = 0;
  var misMatches = [];
  var updated = "\n";
  
  if (userId != null && userId != ''){
    var contestRow = firstContestRow;
    for (var i = contestRow, j = 0; j < Alast; ++i, ++j){
      var formula = sheet.getRange(i, 1).getFormula();
      var url = getUrlFromForumla(formula);
      var contestId = getLastSplit(url, '/');
      if (contestId != null && contestId != ''){
        var link = buildUrl(userId, contestId);
        Logger.log("trying url: " + link);
        var solveCount = getSolveCount(link);
        if (solveCount[0] == 'ERR' || solveCount[1] == 'ERR'){
//          sheet.getRange(i, col).setBackground("red");
//          sheet.getRange(i, col + 1).setBackground("red");
        }
        else{
          var prevSolve=sheet.getRange(i, col).getValue();
          var prevUpsolve=sheet.getRange(i, col+1).getValue();
          if(prevSolve!=solveCount[0]){
            totalMismatch++;
            updated=updated.concat('\n(Row ' + i +' Solve) -> "' +prevSolve + '"' + ' to "' + solveCount[0] + '"');
          }
          sheet.getRange(i, col).setValue(solveCount[0]);
          if(prevUpsolve!=solveCount[1]){
            totalMismatch++;
            updated=updated.concat('\n(Row ' + i +' Upsolve) -> "' +prevUpsolve + '"' + ' to "' + solveCount[1] + '"');
            if (solveCount[1] != 0){
              sheet.getRange(i, col + 1).setValue(solveCount[1]);
            }else{
              sheet.getRange(i, col+1).setValue('');
            }
          }
          
        }      
      }
    }
  }
  timezone = "GMT+" + new Date().getTimezoneOffset()/60
  var date = Utilities.formatDate(new Date(), timezone, "HH:mm yyyy-MM-dd");
  var endMsg = "\n\nPlease report to sajjad15-6764@diu.edu.bd if you have any issue regarding this update";
  sheet.getRange(8, col).setNote("Updated at \n" + date + " UTC\nTotal mismatch: " + totalMismatch + updated + endMsg);
  var userName = sheet.getRange(CFhandleRow, col).getValue();
  Browser.msgBox('Finished Running Script For User: '+ userName + "\\nTotal mismatch: " + totalMismatch);
}

// Codeforces data update for a user

function currentChosenContest(){
  var col = currentChosenCellColumn();
  var row = currentChosenCellRow();
  
//  get contest ID from selected CELL
  var formula = sheet.getRange(row, 1).getFormula();
  var url = getUrlFromForumla(formula);
  if(cfLinkValidation(url)=='invalid')
  {
    Browser.msgBox('Contest url is invalid. Please enter a codeforces.com contest link');
    return;
  }
  var contestName = sheet.getRange(row, 1).getValue(); 
  var contestId = getLastSplit(url, '/');
  //Browser.msgBox('Contest url: '+ formula+' contestid is: '+ contestId);
  var currentUserColumn = firstUserColumn;
  
  for (var i = currentUserColumn; i <= sheet.getLastColumn(); i+=2){
    var currentUserId = getCurrentUser(i);
    if (currentUserId != '' && currentUserId != null){
      var url = buildUrl(currentUserId, contestId);
      Logger.log("trying url: " + url);
      var solveCount = getSolveCount(url);
      if (solveCount[0] == 'ERR' || solveCount[1] == 'ERR'){
        sheet.getRange(row, i).setBackground("red");
        sheet.getRange(row, i + 1).setBackground("red");
      }
      else{          
        sheet.getRange(row, i).setValue(solveCount[0]);
        if (solveCount[1] != 0){
          sheet.getRange(row, i+1).setValue(solveCount[1]);
        }else{
          sheet.getRange(row, i+1).setValue('');
        }
      }
    }
  }
  Browser.msgBox('Finished Running Script For Contest: '+ contestName);
}



// vjudge data update for a contest

function vjudgeChosenContest(){
  var col = currentChosenCellColumn();
  var row = currentChosenCellRow();
  // sample api link: https://vjudge.net/contest/rank/single/424279
//  get contest ID from selected CELL
  var formula = sheet.getRange(row, 1).getFormula();
  //var url = getUrlFromForumla(formula);
  // Logger.log(url);
  // Browser.msgBox('Contest url: '+ formula);
  var contestName = sheet.getRange(row, 1).getValue(); 
  var contestId = getVjContestFromForumla(formula);
  if(contestId == 'invalid')
  {
    Browser.msgBox('Contest url is invalid. Please enter a vjudge.net contest link');
    return;
  }
  
  var currentUserColumn = firstUserColumn;
  var userColumnIndexMap = {}
  var handleList =[]
  for (var i = currentUserColumn; i <= sheet.getLastColumn(); i+=2){
    var vjHandle =sheet.getRange(5, i).getValue()
    if(vjHandle==''|| vjHandle==null)continue;
    userColumnIndexMap[ vjHandle]=i;
    handleList.push(vjHandle)
    //Logger.log(vjHandle+" user data in index: "+ i)
  }
  // Logger.log("erfanul007 user data in index: "+ userColumnIndexMap["erfanul007"])
  // if(userColumnIndexMap["fuadwasi"])
  // Logger.log("fuadwasi user data in index: "+ userColumnIndexMap["fuadwasi"])

   var vjContestData = vjudgeDataProcess(contestId)
   //Browser.msgBox(vjContestData);
   var handleListLen=handleList.length
   for(var i=0;i<handleListLen;i++)
   {
     if(vjContestData[handleList[i]])
     {
       
       sheet.getRange(row, userColumnIndexMap[handleList[i]]).setValue(vjContestData[handleList[i]].isPresent?vjContestData[handleList[i]].contestSolve:'A');
       if(vjContestData[handleList[i]].upSolve)
       sheet.getRange(row, userColumnIndexMap[handleList[i]]+1).setValue(vjContestData[handleList[i]].upSolve);
     }
     else{
       sheet.getRange(row, userColumnIndexMap[handleList[i]]).setValue('A');
     }
   }
  Browser.msgBox('Finished Running Script For Contest: '+ contestName);
}

    function problemIndexGenerate() {
      var row = currentChosenCellRow();
      var totalProblem = sheet.getRange(row, 3).getValue();
      if (totalProblem==null||totalProblem=='')totalProblem=30
      var dist = {}
      for (var i = 0; i < totalProblem; i++) {
        dist[i] = 0;
      }
      return dist;
    }


function vjudgeDataProcess(contestId)
{
 // contestId = '424279'
    //contestId = '424640'
  var responseData=getVjudgeData(contestId);
  var contestTitle = responseData.title;
  var time = parseInt(responseData.length) / 1000;
  Logger.log(time);
  var participants = responseData.participants;
  var participantsData = participants;
  var submissions = responseData.submissions;
  var participanrsObj = Object.entries(participants)
  // Logger.log(participanrsObj)
  participanrsObj.forEach(element => {
        //console.log(element[1][0])
        var dist = {
          participantId: element[0],
          userName: element[1][0],
          name: element[1][1],
          solveCount: 0,
          upSolveCount: 0,
          isPresent: false,
          solves: problemIndexGenerate(),
        }
        participantsData[element[0]] = dist
        // console.log(participantsData[element[0]])
      });
      submissions.forEach(e => {
        if (e[2] == 1) {
          if (participantsData[e[0]].solves[e[1]] == 0) {
            //console.log("functiom working")
            participantsData[e[0]].solves[e[1]] = 1
            if (e[3] >= time) {
              participantsData[e[0]].upSolveCount += 1
            } else {
              participantsData[e[0]].solveCount += 1
              participantsData[e[0]].isPresent=true
            }
          }
        }
        else{
          if(e[3] < time)participantsData[e[0]].isPresent=true
        }
      });
      var data = {}
      participanrsObj.forEach(e => {
        //Logger.log(participantsData[e[0]])
        var tmp={
          userid: e[0],
          userName:participantsData[e[0]].userName,
          contestSolve: participantsData[e[0]].solveCount,
          upSolve: participantsData[e[0]].upSolveCount,
          isPresent:participantsData[e[0]].isPresent
        }
        data[participantsData[e[0]].userName]=tmp
        //data.push(participantsData[e[0]])
      });
      Logger.log(data)
      return data;
  
}


function getVjudgeData(contestId){
  //contestId = '424640'
  var formData = {
   'username': 'DIU_stdio_h',
   'password': '123456789'
 };
 
 var options = {
   'method' : 'post',
   'payload' : formData,
   'User-Agent' : 'PostmanRuntime/7.26.10',
 };

  
  var start = new Date();
  Logger.log('Before calling api: ' + start)
 
  var response = UrlFetchApp.fetch('https://vjudge.net/user/login', options);

  var headers = response.getAllHeaders();
  var cookies = headers['Set-Cookie']; 
  for (var i = 0; i < cookies.length; i++) {
    cookies[i] = cookies[i].split( ';' )[0];
  };

 var options2 = {
   'method' : 'get',
   "headers": {
      "Cookie": cookies.join(';')
    },
   'User-Agent' : 'PostmanRuntime/7.26.10'
 };

  var apiUrl= 'https://vjudge.net/contest/rank/single/'+contestId
  var response = UrlFetchApp.fetch(apiUrl,options2);
  //Logger.log(response)
  return JSON.parse(response);
  
}

function buildUrl(handle, contestid){
//  var url = 'https://blue-cf-tracker.herokuapp.com/{{ handle }}/{{ contestid }}';
  var url = 'https://cf-contest-tracker.herokuapp.com/{{ handle }}/{{ contestid }}';
  url = url.replace('{{ handle }}', handle);
  url = url.replace('{{ contestid }}', contestid);
  return url;
}

function getUrlFromForumla(formula){
  if (formula == '' || formula == null){
    return null;
  }
  var extracted = /"(.*?)"/.exec(formula);
  if (extracted != null && extracted.length >= 2){
    return extracted[1];
  }

  return formula; 
}
function cfLinkValidation(url){
    var strs=url.split("/");
    if(strs[2]=='codeforces.com'&&strs[3]=="contest"&&strs[4]!=''){
      return 'valid'
    }
  return 'invalid'; 
}

function getVjContestFromForumla(formula){
  if (formula == '' || formula == null){
    return null;
  }
  var extracted = /"(.*?)"/.exec(formula);
  if (extracted != null && extracted.length >= 2){
    var contestUrl= extracted[1];
    var strs=contestUrl.split("/");
    if(strs[2]=='vjudge.net'&&strs[3]=="contest"&&strs[4]!=''){
      var contestID = strs[4].split("#")
      return contestID[0];
    }
    
  }
  return 'invalid'; 
}

function getCurrentUser(column){
  var userProfileLink = getUrlFromForumla(sheet.getRange(CFhandleRow, column).getFormula());
  if (userProfileLink == null || userProfileLink == ''){
    var urlFromValue = getUrlFromForumla(sheet.getRange(CFhandleRow, column).getValue());
    return getLastSplit(urlFromValue, '/');
  }
  return getLastSplit(userProfileLink, '/');
}

function getLastSplit(text, splitter){
  if (text != null && text.length > 0){
    var splits = text.split(splitter);
    return splits[splits.length - 1];
  }
  return text;
}
function getSelectedCellUrl(){
  return sheet.getActiveCell().getFormula();
}

function getCurrentCellValue(){
  return sheet.getActiveCell().getValue();
}

function currentChosenCellRow(){
  return sheet.getActiveCell().getRow();
}

function currentChosenCellColumn(){
  return sheet.getActiveCell().getColumn();
}
