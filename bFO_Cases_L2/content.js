// ==UserScript==
// @name        L3 bFO Extras2
// @namespace   Violentmonkey Scripts
// @match       https://*.force.com/*
// @grant       none
// @run-at document-idle
// @version     2.4
// @author      MarioV
// @description 2/15/2023, 7:36:29 AM
// ==/UserScript==

//Variables & constants
const myBfoAlias = "MaVielma"; // the user's bfo alias
const dateFormatType = 1; // the type of date format used in the table

const isEnable = { // an object specifying which features are enabled
	newEmail: true,
	daysWithoutSendingEmail: true,
	daysWithoutFeedback: true,
	firstPending: true,
	lastUpdateBy: true,
	tarFive: true,
	lastCaseUpdate: true,
}
const escalationHours = [24, 48, 72, 96, 115, 120]; // an array of numbers representing the number of hours since escalation that trigger highlighting in certain situations
const daysWithoutUpdate = [15, 20, 25, 30, 35]; // an array of numbers representing the number of days since the last update that trigger highlighting in certain situations
const lastcustomerHours = [0, 48, 24, 180]; // an array of numbers representing the number of hours since last customer email that trigger highlighting in certain situations (for Expert/Advanced cases)

//Colors
var colors = {
	red1Color: '#F48484',
	yellow1Color: '#f1ce64',
	yellow2Color: '#FFEA20',
	orange1Color: '#fb8614',
	green1Color: '#27d76c',
	green2Color: '#34ebd8',
	blue1Color: '#5296D7',
	gray1Color: '#DDDDDD',
	yellow3Color: '#FFF3CF',
	purple1Color: '#ffb3db',
	gradient1Color: '#fcfcc6',
	gradient2Color: '#ffe7b2',
	gradient3Color: '#ffd1a7',
	gradient4Color: '#ffbca4',
	gradient5Color: '#ffa8a8',
}

// This function initiates the highlighting of table rows and sets up a mutation observer to monitor changes to the DOM and update the highlighting accordingly.
function start() {
	updateHighlighting();
	const observer = new MutationObserver(() => updateHighlighting());
	observer.observe(document.body, { childList: true, subtree: true });
}

function updateHighlighting() {

	var now = new Date(); //Current Date
	//ColorAndText set
	const setColorAndText = (col, text, color) => {
		tableRows[i + col].style.backgroundColor = color;
		tableRows[i + col].textContent = text;
	}
	// Find table, header and rows
	// Store the entire table, header and rows for reference
	var table = document.querySelector('.slds-table');
	if (!table) {
		return;
	}
	var tableHeader = table.querySelectorAll('thead th');
	if (!tableHeader.length) {
		return;
	}
	var tableRows = table.querySelectorAll('.slds-cell-edit.cellContainer');
	if (!tableRows.length) {
		return;
	}

	// Find where columns located
	var columnVars = {
		"Case Number": "caseNumberCol",
		"Action needed from": "actionNeededFCol",
		"Last Modified Date": "lastModifiedCol",
		"Expert Escalation Age": "expertAgeCol",
		"Status": "statusCol",
		"Last Customer Email Date": "lastCusEmailCol",
		"Last Reply to Customer Date": "lastReply2CusCol",
		"Last Modified By Alias": "lastModiByAliasCol",
		"&nbsp": "blankCol"
	};
	//Set columnVars to NaN
	for (var key in columnVars) {
		window[columnVars[key]] = NaN;
	}

	// The following code loops through each element of the table header and checks if its innerHTML matches a pattern in the columnVars object.
	for (var i = 0; i < tableHeader.length; i++) {
		for (var col in columnVars) {
			if (tableHeader[i].innerHTML.match(col + '*')) {
				window[columnVars[col]] = i;
				break;
			}
		}
	}

	var allColumnsAreValid = Object.values(columnVars).every(col => typeof window[col] === 'number');

	if (allColumnsAreValid) {
		// Loop table to highlight
		for (var i = 0; i < tableRows.length; i += tableHeader.length) {
			for (var j = 0; j < tableHeader.length; j++) {

				/////////////////////////////////////Internal variables
				////////////////////////////////////
				let isEngineeringBU = tableRows[i + actionNeededFCol].innerHTML.match('Engineering/BU*');

				let lastCustEmailDate = new Date(Date.parse(getConvertedDateTime(dateFormatType, tableRows[i + lastCusEmailCol].textContent)));
				let lastReplyEmailDate = new Date(Date.parse(getConvertedDateTime(dateFormatType, tableRows[i + lastReply2CusCol].textContent)));
				let lastModifiedDate = new Date(Date.parse(getConvertedDateTime(dateFormatType, tableRows[i + lastModifiedCol].textContent)));
				let lastModifiedAlias = tableRows[i + lastModiByAliasCol] ? tableRows[i + lastModiByAliasCol].textContent : '';
				let expertAgeValue = parseFloat(tableRows[i + expertAgeCol].textContent);

				let timeSinceLastResponse = parseFloat((((now - lastCustEmailDate) / 1000) / 3600).toFixed(2));
				let timeSinceLastCustReply = parseFloat((((now - lastReplyEmailDate) / 1000) / 3600).toFixed(2));
				let timeReplyResponseDif = parseFloat((((lastReplyEmailDate - lastCustEmailDate) / 1000) / 3600).toFixed(2));
				let timeSinceLastModResponse = parseFloat((((now - lastModifiedDate) / 1000) / 3600).toFixed(2));

				let timeSinceLastResponseNoWK = calculateElapsedTimeWithoutWeekends(lastCustEmailDate, now, timeSinceLastResponse);
				let timeSinceLastModResponseNoWK = calculateElapsedTimeWithoutWeekends(lastModifiedDate, now, timeSinceLastModResponse);
				let timeSinceLastReplyNoWK = calculateElapsedTimeWithoutWeekends(lastReplyEmailDate, now, timeSinceLastCustReply);

				let timeSinceLastResponseHM = hoursAndMinutes(timeSinceLastResponseNoWK);
				let timeSinceLastModResponseHM = hoursAndMinutes(timeSinceLastModResponseNoWK);
				let timeSinceLastReplyHM = hoursAndMinutes(timeSinceLastReplyNoWK);
				/////////////////////////////////////
				/////////////////////////////////////

				//If for updates
				if (!isNaN(lastReplyEmailDate) && !isNaN(lastCustEmailDate)) {
					if (isEnable.newEmail == true && timeReplyResponseDif <= lastcustomerHours[0] && timeSinceLastResponse <= lastcustomerHours[1] && !tableRows[i + statusCol].innerHTML.match('Answer*')) {
						setColorAndText(blankCol, `${timeSinceLastResponseHM} ago last customer email`, colors.green1Color)
					} else if (isEnable.daysWithoutSendingEmail == true && timeReplyResponseDif <= lastcustomerHours[0] && timeSinceLastResponse > lastcustomerHours[2] && timeSinceLastResponse <= lastcustomerHours[3]) {
						setColorAndText(blankCol, `${timeSinceLastResponseHM} without sending an email`, colors.gray1Color)
					} else if (isEnable.daysWithoutFeedback == true && timeReplyResponseDif >= lastcustomerHours[0] && timeSinceLastCustReply > lastcustomerHours[2] && timeSinceLastCustReply <= lastcustomerHours[3]) {
						setColorAndText(blankCol, `${timeSinceLastReplyHM} without feedback from customer`, colors.purple1Color)
					}
				} else if (isEnable.firstPending == true && lastReplyEmailDate == 'Invalid Date' && timeSinceLastResponseNoWK < 72) {
					//1st response pending only shown for 72 hours.
					setColorAndText(blankCol, '1st response pending', colors.red1Color)
				}

				//If for last person
				if (isEnable.lastUpdateBy == true && lastModifiedAlias != myBfoAlias && lastModifiedAlias != 'syinterf' && lastModifiedAlias != '') {
					setColorAndText(caseNumberCol, `${timeSinceLastModResponseHM} ago by ${lastModifiedAlias}`, colors.green2Color)
				}

				//If for days since last update
				if (isEnable.lastCaseUpdate == true && !isNaN(lastModifiedDate) && isEngineeringBU) {
					var timeLeft = Math.round((now - lastModifiedDate) / 86400000);
					if (timeLeft >= daysWithoutUpdate[4]) {
						setColorAndText(0, `${timeLeft} days`, colors.gradient5Color)
					} else if (timeLeft >= daysWithoutUpdate[3]) {
						setColorAndText(0, `${timeLeft} days`, colors.gradient4Color)
					} else if (timeLeft >= daysWithoutUpdate[2]) {
						setColorAndText(0, `${timeLeft} days`, colors.gradient3Color)
					} else if (timeLeft >= daysWithoutUpdate[1]) {
						setColorAndText(0, `${timeLeft} days`, colors.gradient2Color)
					} else if (timeLeft >= daysWithoutUpdate[0]) {
						setColorAndText(0, `${timeLeft} days`, colors.gradient1Color)
					}
				}

				// Checks conditions to determine which color and text should be displayed based on the value of "expertAgeValue".
				if (isEnable.tarFive == true && !isNaN(expertAgeValue) && !isEngineeringBU) {
					if (expertAgeValue > escalationHours[5]) {
						setColorAndText(0, 'Expired', colors.gray1Color)
					} else if (expertAgeValue >= escalationHours[3] && expertAgeValue <= escalationHours[5]) {
						expertAgeValue = (escalationHours[5] - expertAgeValue).toFixed(2);
						setColorAndText(0, `${expertAgeValue}h left`, colors.gradient5Color)
					} else if (expertAgeValue >= escalationHours[2] && expertAgeValue <= escalationHours[5]) {
						setColorAndText(0, `Day 4`, colors.gradient3Color)
					} else if (expertAgeValue >= escalationHours[1] && expertAgeValue <= escalationHours[5]) {
						setColorAndText(0, `Day 3`, colors.gradient2Color)
					} else if (expertAgeValue >= escalationHours[0] && expertAgeValue <= escalationHours[5]) {
						setColorAndText(0, `Day 2`, colors.gradient1Color)
					}
				}
			}
		}
	}
}

// This function converts a datetime string to the MM/DD/YYYY format used for calculations, based on the user's preferred format
function getConvertedDateTime(dateFormatType, dateTimeText) {
	if (dateFormatType === 1) {// If the format type is already MM/DD/YYYY, return the datetime string as is
		return dateTimeText;
	} else if (dateFormatType === 2) {// If the format type is DD/MM/YYYY, convert to MM/DD/YYYY
		return dateTimeText.replace(/(\d{2}).(\d{2}).(\d{4})/, "$2/$1/$3");
	} else if (dateFormatType === 3) {// If the format type is YYYY-MM-DD, convert to MM/DD/YYYY
		return dateTimeText.replace(/(\d{4})-(\d{2})-(\d{2})/, "$2/$3/$1");
	} else if (dateFormatType === 4) {// If the format type is YYYY-DD-MM, convert to MM/DD/YYYY
		return dateTimeText.replace(/(\d{4})-(\d{2})-(\d{2})/, "$3/$2/$1");
	} else {// If the format type is unknown, return the datetime string as is
		return dateTimeText;
	}
}

// This function converts a number of hours into a string representation of hours and minutes
function hoursAndMinutes(hours) {
	if (hours >= 24) { // If there are 24 or more hours, return a string with days and hours
		var d = Math.floor(hours / 24); // Calculate the number of days
		var h = Math.floor(hours % 24); // Calculate the number of hours left over after the days are counted
		var m = Math.round((hours - Math.floor(hours)) * 60); // Calculate the number of minutes
		return d + 'd ' + h + 'h ';
	} else { // If there are fewer than 24 hours, return a string with just hours and minutes
		var h = Math.floor(hours); // Calculate the number of hours
		var m = Math.round((hours - h) * 60); // Calculate the number of minutes
		return h + 'h ' + m + 'm';
	}
}

// This function calculates the number of elapsed hours between two dates, excluding weekends
function calculateElapsedTimeWithoutWeekends(startDate, endDate, elapsedHours) {
	const daysSinceLastCustEmail = Math.floor((endDate - new Date(startDate)) / 86400000); // Number of days between the two dates, excluding weekends
	const elapsedWeekends = Math.floor((daysSinceLastCustEmail + (new Date(startDate).getDay())) / 7) * 2; // Number of weekends between the two dates
	const elapsedHoursWithoutWeekends = elapsedHours - (elapsedWeekends * 24); // Subtract the number of weekend hours from the elapsed time
	return parseFloat(elapsedHoursWithoutWeekends.toFixed(2));	// Return the elapsed time without weekends, rounded to two decimal places
}
//This line sets the onload event to call the start() function when the webpage is fully loaded.
DOMContentLoaded = start();
