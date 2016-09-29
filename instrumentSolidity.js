// var SolidityParser = require("solidity-parser");
var solparse = require("solparse");
var fs = require('fs');

var path = require("path");
module.exports = function(pathToFile, instrumentingActive){

	// var result = SolidityParser.parseFile("./" + pathToFile);
	var contract = fs.readFileSync("./" + pathToFile).toString();
	var result = solparse.parse(contract);
	var instrumented = "";
	const __INDENTATION__ = "    ";
	var parse = {};
	var runnableLines=[];
	var fnMap = {};
	var fnId = 0;
	var branchMap = {};
	var branchId = 0;
	var statementMap = {};
	var statementId = 0;
	var linecount = 1;
	var fileName = path.basename(pathToFile);
	var injectionPoints = {};

	function createOrAppendInjectionPoint(key, value){
		if (injectionPoints[key]){
			injectionPoints[key].push(value);
		}else{
			injectionPoints[key] = [value];
		}
	}

	function instrumentAssignmentExpression(expression){
		//The only time we instrument an assignment expression is if there's a conditional expression on
		//the right
		if (expression.right.type==='ConditionalExpression'){
			if (expression.left.type==='DeclarativeExpression'){
				//Then we need to go from bytes32 varname = (conditional expression)
				//to 					  bytes32 varname; (,varname) = (conditional expression)
				createOrAppendInjectionPoint(expression.left.end, {type:"literal", string:"; (," + expression.left.name + ")"});
			}else {
				console.log(expression.left)
				process.exit();
			}
		}
	}

	function instrumentConditionalExpression(expression){
		branchId +=1;

		startline = (contract.slice(0,expression.start).match(/\n/g)||[]).length + 1;
		var startcol = expression.start - contract.slice(0,expression.start).lastIndexOf('\n') -1;
		consequentStartCol = startcol + expression.consequent.start - expression.start;
		consequentEndCol = consequentStartCol + expression.consequent.end - expression.consequent.start;
		alternateStartCol = startcol + expression.alternate.start - expression.start;
		alternateEndCol = alternateStartCol + expression.alternate.end - expression.alternate.start;
		//NB locations for conditional branches in istanbul are length 1 and associated with the : and ?.
		branchMap[branchId] = {line:startline, type:'cond-expr', locations:[{start:{line:startline, column:consequentStartCol},end:{line:startline,column:consequentEndCol}},{start:{line:startline, column:alternateStartCol},end:{line:startline,column:alternateEndCol}}]}

		//Right, this could be being used just by itself or as an assignment. In the case of the latter, because
		//the comma operator doesn't exist, we're going to have to get funky.
		//if we're on a line by ourselves, this is easier
		//
		//Now if we've got to wrap the expression it's being set equal to, do that...


		//Wrap the consequent
		createOrAppendInjectionPoint(expression.consequent.start, {type:"openParen"});
		createOrAppendInjectionPoint(expression.consequent.start, {type:"callBranchEvent",comma:true, branchId: branchId, locationIdx: 0});
		createOrAppendInjectionPoint(expression.consequent.end, {type:"closeParen"});

		//Wrap the alternate
		createOrAppendInjectionPoint(expression.alternate.start, {type:"openParen"});
		createOrAppendInjectionPoint(expression.alternate.start, {type:"callBranchEvent",comma:true, branchId: branchId, locationIdx: 1});
		createOrAppendInjectionPoint(expression.alternate.end, {type:"closeParen"});
	}

	function instrumentStatement(expression){
		canCover = false;
		//Can only instrument here if this is a self-contained statement
		//So if this is the start of the line, we're good
		if ( contract.slice(contract.slice(0,expression.start).lastIndexOf('\n'), expression.start).trim().length===0 ){
			canCover=true;
		}
		//If it's preceeded by a '{', we're good
		if ( contract.slice(contract.slice(0,expression.start).lastIndexOf('{')+1, expression.start).trim().length===0 ){
			canCover=true;
		}

		//If it's preceeded by a ';', we're good
		if ( contract.slice(contract.slice(0,expression.start).lastIndexOf(';')+1, expression.start).trim().length===0 ){
			canCover=true;
		}

		if (!canCover){return;}
		//We need to work out the lines and columns the expression starts and ends
		statementId +=1;
		linecount = (contract.slice(0,expression.start).match(/\n/g)||[]).length + 1;
		var startline = linecount;
		var startcol = expression.start - contract.slice(0,expression.start).lastIndexOf('\n') -1;
		var expressionContent = contract.slice(expression.start, expression.end);

		var endline = startline + (expressionContent.match('/\n/g') || []).length ;
		var endcol;
		if (expressionContent.lastIndexOf('\n')>=0){
			endcol = contract.slice(expressionContent.lastIndexOf('\n'), expression.end).length -1;
		}else{
			endcol = startcol + expressionContent.length -1;

		}
		statementMap[statementId] = {start:{line: startline, column:startcol},end:{line:endline, column:endcol}}

		createOrAppendInjectionPoint(expression.start, {type:"statement", statementId: statementId});
	}

	function instrumentLine(expression){
		//what's the position of the most recent newline?
		var startchar = expression.start
		var endchar = expression.end

		lastNewLine = contract.slice(0, startchar).lastIndexOf('\n');
		nextNewLine = startchar + contract.slice(startchar).indexOf('\n');
		var contractSnipped = contract.slice(lastNewLine, nextNewLine);
		//Remove comments
		while (contractSnipped.trim().slice(0,2)==='//'){
			contractSnipped.replace(/\/\/.*?/g,"");
		}
		// Is everything before us and after us on this line whitespace?
		if (contract.slice(lastNewLine, startchar).trim().length===0 && contract.slice(endchar,nextNewLine).replace(';','').trim().length===0){
			createOrAppendInjectionPoint(lastNewLine+1,{type:"callEvent"});
		}
	}

	function instrumentFunctionDeclaration(expression){
		fnId+=1;
		linecount = (contract.slice(0,expression.start).match(/\n/g)||[]).length + 1;
		//We need to work out the lines and columns the function declaration starts and ends
		var startline = linecount;
		var startcol = expression.start - contract.slice(0,expression.start).lastIndexOf('\n') -1;
		var endlineDelta = contract.slice(expression.start).indexOf('{')+1;
		var functionDefinition = contract.slice(expression.start, expression.start + endlineDelta);
		var endline = startline + (functionDefinition.match(/\n/g)||[]).length;
		var endcol = functionDefinition.length - functionDefinition.lastIndexOf('\n')
		fnMap[fnId] = {name: expression.name, line: linecount, loc:{start:{line: startline, column:startcol},end:{line:endline, column:endcol}}}
		createOrAppendInjectionPoint(expression.start + endlineDelta+1,{type: "callFunctionEvent", fnId: fnId} );
	}

	function instrumentIfStatement(expression){
		branchId +=1;
		startline = (contract.slice(0,expression.start).match(/\n/g)||[]).length + 1;
		var startcol = expression.start - contract.slice(0,expression.start).lastIndexOf('\n') -1;
		//NB locations for if branches in istanbul are zero length and associated with the start of the if.
		branchMap[branchId] = {line:linecount, type:'if', locations:[{start:{line:startline, column:startcol},end:{line:startline,column:startcol}},{start:{line:startline, column:startcol},end:{line:startline,column:startcol}}]}
		createOrAppendInjectionPoint(expression.consequent.start+1,{type: "callBranchEvent", branchId: branchId, locationIdx: 0} )
		if (expression.alternate && expression.alternate.type==='IfStatement'){
			createOrAppendInjectionPoint(expression.alternate.start, {type: "callBranchEvent", branchId: branchId, locationIdx:1, openBracket: true})
			createOrAppendInjectionPoint(expression.alternate.end, {type:"closeBracket"});
			//It should get instrumented when we parse it
		} else if (expression.alternate){
			createOrAppendInjectionPoint(expression.alternate.start+1, {type: "callBranchEvent", branchId: branchId, locationIdx: 1})
		} else {
			createOrAppendInjectionPoint(expression.consequent.end, {type: "callEmptyBranchEvent", branchId: branchId, locationIdx: 1});
		}

	}

	parse["AssignmentExpression"] = function (expression, instrument){
		if (instrument){instrumentStatement(expression)}
		if (instrument){instrumentAssignmentExpression(expression)}
		parse[expression.left.type](expression.left, instrument);
		parse[expression.right.type](expression.right, instrument);
	}

	parse["ConditionalExpression"] = function(expression, instrument){
		if (instrument){ instrumentConditionalExpression(expression); }
		parse[expression.test.left.type](expression.test.left, instrument);
		parse[expression.test.right.type](expression.test.right,instrument);
		parse[expression.consequent.type](expression.consequent, instrument)
		parse[expression.alternate.type](expression.alternate,instrument);
	}

	parse["Identifier"] = function(expression, instrument){
	}

	parse["InformalParameter"] = function(expression, instrument){
	}

	parse["Literal"] = function(expression, instrument){
	}

	parse["ModifierName"]  = function(expression, instrument){
	};

	parse["Modifiers"] = function(modifiers, instrument){
		for (x in modifiers){
			parse[modifiers[x].type](modifiers[x], instrument);
		}
	}

	parse["ThisExpression"] = function(expression, instrument){
	}

	parse["ReturnStatement"] = function(expression, instrument){
		if (instrument){instrumentStatement(expression)}
		parse[expression.argument.type](expression.argument, instrument);
	}

	parse["NewExpression"] = function(expression, instrument){
		parse[expression.callee.type](expression.callee, instrument);
		for (x in expression.arguments){
			parse[expression.arguments[x].type](expression.arguments[x], instrument)
		}
	}

	parse["MemberExpression"]  = function (expression, instrument){
		parse[expression.object.type](expression.object, instrument);
		parse[expression.property.type](expression.property, instrument);
	}

	parse["CallExpression"] = function (expression,instrument){
		if (instrument){instrumentStatement(expression)}
		parse[expression.callee.type](expression.callee, instrument);
		for (x in expression.arguments){
			parse[expression.arguments[x].type](expression.arguments[x], instrument)
		}
	}

	parse["UnaryExpression"] = function(expression, instrument){
		parse[expression.argument.type](expression.argument, instrument);
	}

	parse["ThrowStatement"] = function(expression, instrument){
		if (instrument){instrumentStatement(expression)}
	}

	parse["BinaryExpression"] = function(expression, instrument){
		parse[expression.left.type](expression.left, instrument)
		parse[expression.right.type](expression.right, instrument)
	}

	parse["IfStatement"] = function(expression, instrument){
		if (instrument){instrumentStatement(expression)}
		if (instrument) {instrumentIfStatement(expression)}
		parse[expression.test.type](expression.test, instrument)
		parse[expression.consequent.type](expression.consequent, instrument)
		if (expression.alternate){
			parse[expression.alternate.type](expression.alternate, instrument)
		}
	}

	parse["SequenceExpression"] = function(expression, instrument){
		parse[expression.expressions[x].type](expression.expressions[x], instrument) + ', ';
	}

	parse["ImportStatement"] = function(expression, instrument){
	}

	parse["DeclarativeExpression"] = function(expression, instrument){
	}

	parse["ExpressionStatement"] = function(content, instrument){
		// if (instrument){instrumentStatement(content.expression)}
		parse[content.expression.type](content.expression, instrument);
	}

	parse["EnumDeclaration"] = function(expression, instrument){
	}

	parse["EventDeclaration"]=function(expression, instrument){
	}

	parse["VariableDeclarationTuple"] = function(expression, instrument){
		parse[expression.init.type](expression.init, instrument)
	}

	parse["BlockStatement"] = function(expression, instrument){
		for (var x=0; x < expression.body.length; x++){
			if (instrument){ instrumentLine(expression.body[x]); }
			parse[expression.body[x].type](expression.body[x], instrument);
		}
	}

	parse["VariableDeclaration"] = function(expression, instrument){
		if (instrument){instrumentStatement(expression)}
		if (expression.declarations.length>1){
			console.log('more than one declaration')
		}
		parse[expression.declarations[0].id.type](expression.declarations[0].id, instrument);
		parse[expression.declarations[0].init.type](expression.declarations[0].init, instrument);
	}

	parse["Type"] = function(expression, instrument){
	}

	parse["UsingStatement"] = function(expression, instrument){
		parse[expression.for.type](expression.for, instrument)
	}

	parse["FunctionDeclaration"] = function(expression, instrument){
		parse["Modifiers"](expression.modifiers, instrument);
		if (expression.body){
			instrumentFunctionDeclaration(expression);
			parse[expression.body.type](expression.body, instrumentingActive);
		}
	}

	parse["ContractStatement"] = function(expression, instrument){
		//Inject our coverage event if we're covering
		if (instrumentingActive){
			//This is harder because of where .start and .end represent, and how documented comments are validated
			//by solc upon compilation. From the start of this contract statement, find the first '{', and inject
			//there.
			var injectionPoint = expression.start + contract.slice(expression.start).indexOf('{')+2;
			if (injectionPoints[injectionPoint]){
				injectionPoints[expression.start + contract.slice(expression.start).indexOf('{')+2].push({type:"eventDefinition"});
			}else{
				injectionPoints[expression.start + contract.slice(expression.start).indexOf('{')+2] = [{type:"eventDefinition"}];
			}
		}

		for (x in expression.body){
			parse[expression.body[x].type](expression.body[x], instrument);
		}
	}

	parse["LibraryStatement"] = function(expression, instrument){
		//Inject our coverage event;
		if(instrumentingActive){

			//This is harder because of where .start and .end represent, and how documented comments are validated
			//by solc upon compilation. From the start of this contract statement, find the first '{', and inject
			//there.
			var injectionPoint = expression.start + contract.slice(expression.start).indexOf('{')+2;
			if (injectionPoints[injectionPoint]){
				injectionPoints[expression.start + contract.slice(expression.start).indexOf('{')+2].push({type:"eventDefinition"});
			}else{
				injectionPoints[expression.start + contract.slice(expression.start).indexOf('{')+2] = [{type:"eventDefinition"}];
			}
		}

		for (x in expression.body){
			parse[expression.body[x].type](expression.body[x], instrument);
		}
	}

	parse["ModifierDeclaration"] = function(expression, instrument){
		instrumentFunctionDeclaration(expression);
		parse[expression.body.type](expression.body, instrumentingActive);
	}

	parse["Program"] = function(expression, instrument){
		for (x in expression.body){
			parse[expression.body[x].type](expression.body[x], instrument);
		}
	}

	var instrumented = parse[result.type](result);
	//We have to iterate through these injection points in descending order to not mess up
	//the injection process.
	var sortedPoints = Object.keys(injectionPoints).sort(function(a,b){return a-b});
	for (x = sortedPoints.length-1; x>=0;  x--){
		injectionPoint = sortedPoints[x];
		//Line instrumentation has to happen first
		injectionPoints[injectionPoint].sort(function(a,b){
			var eventTypes = ["openParen", "closeBracket","callBranchEvent","callEvent"];
			return eventTypes.indexOf(b.type) - eventTypes.indexOf(a.type);
		});
		for (y in injectionPoints[injectionPoint]){
			injection = injectionPoints[injectionPoint][y];
			if (injection.type==='callEvent'){
				linecount = (contract.slice(0, injectionPoint).match(/\n/g)||[]).length+1;
				runnableLines.push(linecount);
				contract = contract.slice(0, injectionPoint) + "Coverage('" + fileName + "'," + linecount + ");\n" + contract.slice(injectionPoint);
			}else if (injection.type==='callFunctionEvent'){
				contract = contract.slice(0, injectionPoint) + "FunctionCoverage('" + fileName + "'," + injection.fnId + ");\n" + contract.slice(injectionPoint);
			}else if (injection.type==='callBranchEvent'){
				contract = contract.slice(0, injectionPoint) + (injection.openBracket? '{' : '') + "BranchCoverage('" + fileName + "'," + injection.branchId + "," + injection.locationIdx + ")" + (injection.comma ? ',' : ";") +  "\n" + contract.slice(injectionPoint);
			}else if (injection.type==='callEmptyBranchEvent'){
				contract = contract.slice(0, injectionPoint) + "else { BranchCoverage('" + fileName + "'," + injection.branchId + "," + injection.locationIdx + ");}\n" + contract.slice(injectionPoint);
			}else if (injection.type==='openParen'){
				contract = contract.slice(0, injectionPoint) + "(" + contract.slice(injectionPoint);
			}else if (injection.type==='closeParen'){
				contract = contract.slice(0, injectionPoint) + ")" + contract.slice(injectionPoint);
			}else if (injection.type==='closeBracket'){
				contract = contract.slice(0, injectionPoint) + "}" + contract.slice(injectionPoint);
			}else if (injection.type==='literal'){
				contract = contract.slice(0, injectionPoint) + injection.string + contract.slice(injectionPoint);
			}else if (injection.type==='statement'){
				contract = contract.slice(0, injectionPoint) + " StatementCoverage('" + fileName + "'," + injection.statementId + ");\n" + contract.slice(injectionPoint);
			}else if (injection.type==='eventDefinition'){
				contract = contract.slice(0, injectionPoint) + "event Coverage(string fileName, uint256 lineNumber);\nevent FunctionCoverage(string fileName, uint256 fnId);\nevent StatementCoverage(string fileName, uint256 statementId);\nevent BranchCoverage(string fileName, uint256 branchId, uint256 locationIdx);\n" + contract.slice(injectionPoint);
			}else{
				console.log('Unknown injection.type');
			}
		}
	}

	return {contract: contract, runnableLines: runnableLines, fnMap: fnMap, branchMap: branchMap, statementMap: statementMap};

}



















