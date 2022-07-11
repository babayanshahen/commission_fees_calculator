const fs = require('fs');
const configurationsService = require('./services/configurations.service');
const fileHelper = require('./helpers/file.helper');
const dateHelper = require('./helpers/date.helper');
const transactionTypes = require('./constants/transactionTypes.constant');
const transactionUserTypes = require('./constants/transactionUserTypes.constant');

const getFilesContents = () => {
	const fileNames = process.argv.splice(2);
	const isfileNamesExist = Array.isArray(fileNames) && fileNames.length;
	if (!isfileNamesExist) {
		console.error('At least one input file is required, please type `node app.js input.json`');
		return;
	}
	let filesContents = {};
	for (const fileName of fileNames) {
		const isJsonFormat = fileHelper.isJson(fileName);
		if (!isJsonFormat) {
			console.error('The input file should be in the `.json` format, and the passed argument/file `' + fileName + '` is not a supported format');
			continue;
		}
		try {
			const fileContent = fs.readFileSync(fileName, 'utf-8');
			try {
				const fileContentToObject = JSON.parse(fileContent);
				filesContents[fileName] = fileContentToObject;
			} catch (err) {
				console.error(err);
			}
		} catch(error) {
			console.error(error);
		}
	}
	return filesContents;
};

const getCashInConfigs = async () => {
	try {
		const response = await configurationsService.getCashIn();
		return response.data;
	} catch (error) {
		console.error(error);
		return null;
	}
}

const getCashOutNaturalConfigs = async () => {
	try {
		const response = await configurationsService.getCashOutNatural();
		return response.data;
	} catch (error) {
		console.error(error);
		return null;
	}
}

const getCashOutJuridicalConfigs = async () => {
	try {
		const response = await configurationsService.getCashOutJuridical();
		return response.data;
	} catch (error) {
		console.error(error);
		return null;
	}
}

const init = async () => {
	const cashInConfigs = await getCashInConfigs();
	const cashOutNaturalConfigs = await getCashOutNaturalConfigs();
	const cashOutJuridicalConfigs = await getCashOutJuridicalConfigs();
	const filesContents = getFilesContents();
	const isConfigurationGotSuccessfully = cashInConfigs && cashOutNaturalConfigs && cashOutJuridicalConfigs;
	if (!isConfigurationGotSuccessfully) {
		console.error('Cannot get the required configurations');
		return;
	}

	const fileNames = Object.keys(filesContents);

	let weeklyCashOutAmountPerUserWeek = {};

	for (fileName of fileNames) {
		weeklyCashOutAmountPerUserWeek = {};
		console.log('Looking at transactions in the `' + fileName + '` file');
		const transactions = filesContents[fileName];
		for (const transaction of transactions) {
    	const operation = transaction.operation;

			switch (transaction.type) {
		    case transactionTypes.CASH_IN:

		    	let commissionFee = operation.amount * cashInConfigs.percents / 100;
		    	commissionFee = commissionFee > cashInConfigs.max.amount ? cashInConfigs.max.amount : commissionFee;
		    	console.log(commissionFee.toFixed(2));
		    	break;

		    case transactionTypes.CASH_OUT:
		    	
		    	switch (transaction.user_type) {
		    		case transactionUserTypes.NATURAL:

		    			const weekNumber = dateHelper.getWeekNumber(new Date(transaction.date)).join('-');

		    			const amountForCurrentUserAndWeek = weeklyCashOutAmountPerUserWeek[transaction.user_id] && weeklyCashOutAmountPerUserWeek[transaction.user_id][weekNumber] || 0;
		    			const newWeeklyAmount = amountForCurrentUserAndWeek + operation.amount;
		    			if (!weeklyCashOutAmountPerUserWeek[transaction.user_id]) {
		    				weeklyCashOutAmountPerUserWeek[transaction.user_id] = {};
		    			}
		    			weeklyCashOutAmountPerUserWeek[transaction.user_id][weekNumber] = newWeeklyAmount;

		    			let taxableAmount = amountForCurrentUserAndWeek > cashOutNaturalConfigs.week_limit.amount ? operation.amount : (newWeeklyAmount >= cashOutNaturalConfigs.week_limit.amount ? newWeeklyAmount - cashOutNaturalConfigs.week_limit.amount : 0);
		    			const commissionFee = taxableAmount * cashOutNaturalConfigs.percents / 100;
		    			console.log(commissionFee.toFixed(2));
		    			break;

	    			case transactionUserTypes.JURIDICAL:

	    				let commissionFeeSecond = operation.amount * cashOutJuridicalConfigs.percents / 100;
				    	commissionFeeSecond = commissionFeeSecond < cashOutJuridicalConfigs.min.amount ? cashOutJuridicalConfigs.mix.amount : commissionFeeSecond;
				    	console.log(commissionFeeSecond.toFixed(2));
		    			break;

	    			default:
	    				console.error('Unknown transaction user type: ', transaction.user_type);
		    	}

		    	break;

	    	default:
	    		console.error('Unknown transaction type: ', transaction.type);
		  }
		}
	}
};

init();
