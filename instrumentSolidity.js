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
	var linecount = 1;
	var fileName = path.basename(pathToFile);
	var injectionPoints = {};

	function instrumentAssignmentExpression(expression){
		//The only time we instrument an assignment expression is if there's a conditional expression on
		//the right
		if (expression.right.type==='ConditionalExpression'){
			if (expression.left.type==='DeclarativeExpression'){
				//Then we need to go from bytes32 varname = (conditional expression)
				//to 					  bytes32 varname; (,varname) = (conditional expression)
				if (injectionPoints[expression.left.end]){
					injectionPoints[expression.left.end].push({type:"literal", string:"; (," + expression.left.name});
				}else{
					injectionPoints[expression.left.end] = [{type:"literal", string:"; (," + expression.left.name + ")"}];
				}
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
		if (injectionPoints[expression.consequent.start]){
			injectionPoints[expression.consequent.start].push({type:"openParen"});
		}else{
			injectionPoints[expression.consequent.start] = [{type:"openParen"}];
		}
		injectionPoints[expression.consequent.start].push({type:"callBranchEvent",comma:true, branchId: branchId, locationIdx: 0});

		if (injectionPoints[expression.consequent.end]){
			injectionPoints[expression.consequent.end].push({type:"closeParen"});
		}else{
			injectionPoints[expression.consequent.end] = [{type:"closeParen"}];
		}

		//Wrap the alternate
		if (injectionPoints[expression.alternate.start]){
			injectionPoints[expression.alternate.start].push({type:"openParen"});
		}else{
			injectionPoints[expression.alternate.start] = [{type:"openParen"}];
		}
		injectionPoints[expression.alternate.start].push({type:"callBranchEvent",comma:true, branchId: branchId, locationIdx: 1});

		if (injectionPoints[expression.alternate.end]){
			injectionPoints[expression.alternate.end].push({type:"closeParen"});
		}else{
			injectionPoints[expression.alternate.end] = [{type:"closeParen"}];
		}

	}

	function instrumentLine(startchar, endchar){
		//what's the position of the most recent newline?
		lastNewLine = contract.slice(0, startchar).lastIndexOf('\n');
		nextNewLine = startchar + contract.slice(endchar).indexOf('\n');
		// Is everything before us and after us on this line whitespace?
		if (contract.slice(lastNewLine, startchar).trim().length===0 && contract.slice(endchar,nextNewLine).trim().length===0){
			if (injectionPoints[lastNewLine+1]){
				injectionPoints[lastNewLine+1].push({type:"callEvent"});
			}else{
				injectionPoints[lastNewLine+1] = [{type:"callEvent"}];
			}
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
		if (injectionPoints[expression.start + endlineDelta +1]){
			injectionPoints[expression.start + endlineDelta +1].push({type: "callFunctionEvent", fnId: fnId});
		}else{
			injectionPoints[expression.start + endlineDelta +1] = [{type: "callFunctionEvent", fnId: fnId}];
		}
	}

	function instrumentIfStatement(expression){
		branchId +=1;
		startline = (contract.slice(0,expression.start).match(/\n/g)||[]).length + 1;
		var startcol = expression.start - contract.slice(0,expression.start).lastIndexOf('\n') -1;
		//NB locations for if branches in istanbul are zero length and associated with the start of the if.
		branchMap[branchId] = {line:linecount, type:'if', locations:[{start:{line:startline, column:startcol},end:{line:startline,column:startcol}},{start:{line:startline, column:startcol},end:{line:startline,column:startcol}}]}
		if (injectionPoints[expression.consequent.start+1]){
			injectionPoints[expression.consequent.start+1].push({type: "callBranchEvent", branchId: branchId, locationIdx: 0})
		}else{
			injectionPoints[expression.consequent.start+1] = [{type: "callBranchEvent", branchId: branchId, locationIdx: 0}];
		}
		if (expression.alternate && expression.alternate.type==='IfStatement'){
			if (injectionPoints[expression.alternate.start]){
				injectionPoints[expression.alternate.start].push({type: "callBranchEvent", branchId: branchId, locationIdx:1, openBracket: true});
			}else{
				injectionPoints[expression.alternate.start] = [{type: "callBranchEvent", branchId: branchId, locationIdx:1, openBracket: true}];
			}
			if (injectionPoints[expression.alternate.end]){
				injectionPoints[expression.alternate.end].push({type: "closeBracket"});
			}else{
				injectionPoints[expression.alternate.end] = [{type: "closeBracket"}];
			}
			//It should get instrumented when we parse it
		} else if (expression.alternate){
			if (injectionPoints[expression.alternate.start+1]){
				injectionPoints[expression.alternate.start+1].push({type: "callBranchEvent", branchId: branchId, locationIdx: 1});
			}else{
				injectionPoints[expression.alternate.start+1] = [{type: "callBranchEvent", branchId: branchId, locationIdx: 1}];
			}
		} else {
			if (injectionPoints[expression.consequent.end]){
				injectionPoints[expression.consequent.end].push({type: "callEmptyBranchEvent", branchId: branchId, locationIdx: 1});
			}else{
				injectionPoints[expression.consequent.end] = [{type: "callEmptyBranchEvent", branchId: branchId, locationIdx: 1}];
			}
		}

	}

	parse["AssignmentExpression"] = function (expression, instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }
		if (instrument){instrumentAssignmentExpression(expression)}
		var retval = "";
		retval += parse[expression.left.type](expression.left, instrument);
		retval += expression.operator;
		retval += parse[expression.right.type](expression.right, instrument) + ';';
		return retval;
	}

	parse["ConditionalExpression"] = function(expression, instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }
		if (instrument){ instrumentConditionalExpression(expression); }
		return parse[expression.test.left.type](expression.test.left, instrument) + expression.test.operator + parse[expression.test.right.type](expression.test.right,instrument) + '?' + parse[expression.consequent.type](expression.consequent, instrument) + ":" + parse[expression.alternate.type](expression.alternate,instrument);
	}

	parse["Identifier"] = function(expression, instrument){
		return expression.name;
	}

	parse["InformalParameter"] = function(expression, instrument){
		return expression.literal.literal;
	}

	parse["Literal"] = function(expression, instrument){
		if (typeof expression.value==='string' && expression.value.slice(0,2)!=="0x"){
			return '"' + expression.value + '"';
		}else{
			return expression.value;
		}
	}

	parse["ModifierName"]  = function(expression, instrument){
		var retvalue = expression.name
		if (expression.params && expression.params.length>0){
			retvalue += '(';
			for (x in expression.params){
				var param = expression.params[x];
				retvalue += param.literal.literal + ', ';
			}
			retvalue = retvalue.slice(0,-2);
			retvalue += ')';
		}
		return retvalue;
	};

	parse["Modifiers"] = function(modifiers, instrument){
		retvalue = "";
		var retModifier = null;
		var constModifier = null;
		for (x in modifiers){
			if (modifiers[x].name==='returns'){
				retModifier = x;
				continue;
			}else if (modifiers[x].name==='constant'){
				constModifier = x;
			}else{
				retvalue+=parse[modifiers[x].type](modifiers[x], instrument);
				retvalue += ' ';
			}
		}
		if (constModifier) {retvalue += 'constant '};
		if (retModifier){
			retvalue += ' returns ';
			retvalue += ' (';
			for (p in modifiers[retModifier].params){
				param = modifiers[retModifier].params[p];
				retvalue+= parse[param.type](param, instrument);
				retvalue += ', ';
			}
			retvalue = retvalue.slice(0,-2);
			retvalue +=')';
		}
		return retvalue;

	}

	parse["ThisExpression"] = function(expression, instrument){
		return 'this'
	}

	parse["ReturnStatement"] = function(expression, instrument){
		var retval = "";
		if (instrument){ instrumentLine(expression.start,expression.end); }


		return retval + 'return ' + parse[expression.argument.type](expression.argument, instrument) + ';';
	}

	parse["NewExpression"] = function(expression, instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }

		var retval = 'new ' + parse[expression.callee.type](expression.callee, instrument);
		retval += '(';
		for (x in expression.arguments){
			retval += parse[expression.arguments[x].type](expression.arguments[x], instrument) + ", "
		}
		if (expression.arguments && expression.arguments.length){
			retval = retval.slice(0,-2);
		}
		retval+=")"

		return retval
	}

	parse["MemberExpression"]  = function (expression, instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }

		if (!expression.computed){
			return parse[expression.object.type](expression.object,instrument) + "." + parse[expression.property.type](expression.property, instrument);
		}else{
			return parse[expression.object.type](expression.object, instrument) + "[" + parse[expression.property.type](expression.property, instrument) + "]";
		}
	}

	parse["CallExpression"] = function (expression,instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }

		var retval = parse[expression.callee.type](expression.callee, instrument) + "(";
		for (x in expression.arguments){
			retval += parse[expression.arguments[x].type](expression.arguments[x], instrument) + ", "
		}
		if (expression.arguments && expression.arguments.length){
			retval = retval.slice(0,-2);
		}
		retval+=")"

		return retval
	}

	parse["UnaryExpression"] = function(expression, instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }

		if (expression.operator==='delete'){
		return expression.operator + ' ' + parse[expression.argument.type](expression.argument, instrument);

		}
		return expression.operator + parse[expression.argument.type](expression.argument, instrument);
	}

	parse["ThrowStatement"] = function(expression, instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }

		var retval = "";
		return retval + 'throw'
	}

	parse["BinaryExpression"] = function(expression, instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }

		return '(' + parse[expression.left.type](expression.left, instrument) + expression.operator + parse[expression.right.type](expression.right, instrument) + ')';
	}

	parse["IfStatement"] = function(expression, instrument){
		var retval = "";
		if (instrument){ instrumentLine(expression.start,expression.end); }

		if (instrument) {instrumentIfStatement(expression)}
		retval += "if (";
		retval += parse[expression.test.type](expression.test, instrument) + "){"
		retval += newLine('{');
		retval += parse[expression.consequent.type](expression.consequent, instrument)
		retval += newLine(retval.slice(-1));
		retval += "}";
		if (expression.alternate){
			retval += 'else ';
			if (expression.alternate.type!=="IfStatement"){
				retval += '{';
				retval += newLine('{');
			}
			retval += parse[expression.alternate.type](expression.alternate, instrument)
			if (expression.alternate.type!=="IfStatement"){
				retval += '}';
				retval += newLine('}');
			}
		}
		return retval;
	}

	parse["SequenceExpression"] = function(expression, instrument){

		retval = "(";
		for (x in expression.expressions){
			retval += parse[expression.expressions[x].type](expression.expressions[x], instrument) + ', ';
		}
		if (expression.expressions && expression.expressions.length>0){
			//remove trailing comma and space if needed
			retval = retval.slice(0,-2);
		}
		retval += ')';
		return retval;
	}

	parse["ImportStatement"] = function(expression, instrument){
		return 'import "' + expression.from + '"';
	}

	parse["DeclarativeExpression"] = function(expression, instrument){
		return expression.literal.literal + ' ' + (expression.is_public ? "public " : "") + (expression.is_constant ? "constant " : "") + expression.name;
	}

	parse["ExpressionStatement"] = function(content, instrument){
		if (instrument){ instrumentLine(content.start,content.end);}
		var retval = "";
		if (content.expression.literal && content.expression.literal.literal && content.expression.literal.literal.type==="MappingExpression"){
			return retval + 'mapping (' + content.expression.literal.literal.from.literal + ' => ' + content.expression.literal.literal.to.literal + ') '+ content.expression.name;
		}else {
			return retval + parse[content.expression.type](content.expression, instrument);
		}
	}

	parse["EnumDeclaration"] = function(expression, instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }

		var retvalue = 'enum ' + expression.name + ' {';
		for (x in expression.members){
			retvalue += expression.members[x] + ', ';
		}
		retvalue = retvalue.slice(0,-2);
		retvalue += '}';
		return retvalue;
	}

	parse["EventDeclaration"]=function(expression, instrument){
		var retval = 'event ' + expression.name + '(';
		for (x in expression.params){
			var param = expression.params[x];
			retval += param.literal.literal + ' ' + (param.isIndexed ? 'true' : '') + param.id + ', ';
		}
		if (expression.params && expression.params.length>0){
			//remove trailing comma and space if needed
			retval = retval.slice(0,-2);
		}
		retval += ')';
		return retval
	}

	parse["VariableDeclarationTuple"] = function(expression, instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }

		var retval = "";

		retval += "var (";
		for (x in expression.declarations){
			retval += expression.declarations[x].id.name + ', ';
		}
		retval = retval.slice(0,-2);
		retval += ") = ";
		retval+=parse[expression.init.type](expression.init, instrument)
		return retval;
	}

	parse["BlockStatement"] = function(expression, instrument){
		var retval = "";
		for (var x=0; x < expression.body.length; x++){
			retval += parse[expression.body[x].type](expression.body[x], instrument);
			retval += newLine(retval.slice(-1));
		}
		return retval;
	}

	parse["VariableDeclaration"] = function(expression, instrument){
		if (instrument){ instrumentLine(expression.start,expression.end); }

		if (expression.declarations.length>1){
			console.log('more than one declaration')
		}
		retval = "";
		return retval + "var " + parse[expression.declarations[0].id.type](expression.declarations[0].id, instrument) + " = " + parse[expression.declarations[0].init.type](expression.declarations[0].init, instrument);
	}

	parse["Type"] = function(expression, instrument){
		return expression.literal;
	}

	parse["UsingStatement"] = function(expression, instrument){
		return "using " + expression.library + " for " + parse[expression.for.type](expression.for, instrument) + ";";
	}

	parse["FunctionDeclaration"] = function(expression, instrument){

		retval = 'function ' + (expression.name ? expression.name : "") + '('
		for (x in expression.params){
			var param = expression.params[x];
			retval += param.literal.literal + ' ' + (param.isIndexed ? 'true' : '') + param.id + ', ';
		}
		if (expression.params && expression.params.length>0){
			retval = retval.slice(0,-2);
		}
		retval += ')';
		retval += parse["Modifiers"](expression.modifiers, instrument);
		if (expression.body){

			instrumentFunctionDeclaration(expression);
			retval+='{' + newLine('{');
			retval += parse[expression.body.type](expression.body, instrumentingActive);
			retval+='}' + newLine('}');
		}
		return retval;
	}

	parse["ContractStatement"] = function(expression, instrument){
		var retval = "";
		retval +=  'contract ' + expression.name

		if (expression.is.length>0){
			retval += ' is '
			for (x in expression.is){
				retval += expression.is[x].name + ', '
			}
			retval = retval.slice(0,-2);
		}

		retval += ' {' + newLine('{');
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
			retval += "event Coverage(string fileName, uint256 lineNumber);\n"; //We're injecting this, so don't count the newline
		}

		for (x in expression.body){
			retval+=parse[expression.body[x].type](expression.body[x], instrument);
			retval += newLine(retval.slice(-1));
		}
		retval += '}' + newLine('}');
		return retval;
	}

	parse["LibraryStatement"] = function(expression, instrument){
		var retval = "";
		retval +=  'library ' + expression.name + ' {' + newLine('{');
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
			retval += "event Coverage(string fileName, uint256 lineNumber);\n"; //We're injecting this, so don't count the newline
		}

		for (x in expression.body){
			retval+=parse[expression.body[x].type](expression.body[x], instrument);
			retval += newLine(retval.slice(-1));
		}
		retval += '}' + newLine('}');

		return retval;
	}

	parse["ModifierDeclaration"] = function(expression, instrument){
		var retval = "";
		retval += 'modifier ' + expression.name + '(';
		for (x in expression.params){
			var param = expression.params[x];
			retval += param.literal.literal + ' ' + (param.isIndexed ? 'true' : '') + param.id + ', ';
		}
		if (expression.params && expression.params.length>0){
			retval = retval.slice(0,-2);
		}
		retval += '){';

		instrumentFunctionDeclaration(expression);

		retval += newLine(retval.slice(-1));
		retval += parse[expression.body.type](expression.body, instrumentingActive);
		retval += newLine(retval.slice(-1));
		retval +='}';
		retval += newLine(retval.slice(-1));
		return retval;
	}

	parse["Program"] = function(expression, instrument){
		retval = "";
		for (x in expression.body){
			retval+=parse[expression.body[x].type](expression.body[x], instrument);
			retval += newLine(retval.slice(-1));
		}
		return retval;
	}

	function newLine(lastchar){
		linecount+=1;
		if (['}','{',';','_','\n'].indexOf(lastchar)>-1){
			return '\n';
		}else{
			return ';\n';
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
			}else{
				console.log(injection.type);
				contract = contract.slice(0, injectionPoint) + "event Coverage(string fileName, uint256 lineNumber);\nevent FunctionCoverage(string fileName, uint256 fnId);\n\nevent BranchCoverage(string fileName, uint256 branchId, uint256 locationIdx);\n" + contract.slice(injectionPoint);
			}
		}
	}

	return {contract: contract, runnableLines: runnableLines, fnMap: fnMap, branchMap: branchMap};

}



















