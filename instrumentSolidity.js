// var SolidityParser = require("solidity-parser");
var solparse = require("solparse");
var fs = require('fs');

var path = require("path");
module.exports = function(pathToFile, instrument){

	// var result = SolidityParser.parseFile("./" + pathToFile);
	var contract = fs.readFileSync("./" + pathToFile).toString();
	var result = solparse.parse(contract);
	var instrumented = "";
	const __INDENTATION__ = "    ";
	var parse = {};
	var runnableLines=[];
	var linecount = 1;
	var fileName = path.basename(pathToFile);
	var dottable = ['msg', 'tx', 'this', 'bytes'];

	function addInstrumentationEvent(){
		runnableLines.push(linecount);
		return "Coverage('" + fileName + "'," + linecount + ");\n";
	}

	parse["AssignmentExpression"] = function (expression, instrument){
		if (instrument){ retval += addInstrumentationEvent(); }
		var retval = "";
		retval += parse[expression.left.type](expression.left, instrument);
		retval += expression.operator;
		retval += parse[expression.right.type](expression.right, instrument) + ';';
		if (dottable.indexOf(expression.right.name)>=0){
			dottable.push(expression.left.name);
		}
		return retval;
	}

	parse["ConditionalExpression"] = function(expression){
		return parse[expression.test.left.type](expression.test.left) + expression.test.operator + parse[expression.test.right.type](expression.test.right) + '?' + parse[expression.consequent.type](expression.consequent) + ":" + parse[expression.alternate.type](expression.alternate);
	}

	parse["Identifier"] = function(expression){
		return expression.name;
	}

	parse["InformalParameter"] = function(expression){
		return expression.literal.literal;
	}

	parse["Literal"] = function(expression){
		if (typeof expression.value==='string' && expression.value.slice(0,2)!=="0x"){
			return '"' + expression.value + '"';
		}else{
			return expression.value;
		}
	}

	parse["ModifierName"]  = function(expression){
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

	parse["Modifiers"] = function(modifiers){
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
				retvalue+=parse[modifiers[x].type](modifiers[x]);
				retvalue += ' ';
			}
		}
		if (constModifier) {retvalue += 'constant '};
		if (retModifier){
			retvalue += ' returns ';
			retvalue += ' (';
			for (p in modifiers[retModifier].params){
				param = modifiers[retModifier].params[p];
				retvalue+= parse[param.type](param);
				retvalue += ', ';
			}
			retvalue = retvalue.slice(0,-2);
			retvalue +=')';
		}
		return retvalue;

	}

	parse["ThisExpression"] = function(expression){
		return 'this'
	}

	parse["ReturnStatement"] = function(expression, instrument){
		var retval = "";
		if (instrument){ retval += addInstrumentationEvent(); }

		return retval + 'return ' + parse[expression.argument.type](expression.argument, instrument) + ';';
	}

	parse["NewExpression"] = function(expression){
		var retval = 'new ' + parse[expression.callee.type](expression.callee);
		retval += '(';
		for (x in expression.arguments){
			retval += parse[expression.arguments[x].type](expression.arguments[x]) + ", "
		}
		if (expression.arguments && expression.arguments.length){
			retval = retval.slice(0,-2);
		}
		retval+=")"

		return retval
	}

	parse["MemberExpression"]  = function (expression){
		// return contract.slice(expression.start, expression.end);
		// var shouldDot = false;
		// if (dottable.indexOf(expression.object.name)>=0){shouldDot = true;}
		// if (expression.object.callee){
		// 	if (dottable.indexOf(expression.object.callee.name)>=0){shouldDot=true;}
		// }
		if (!expression.computed){
			return parse[expression.object.type](expression.object) + "." + parse[expression.property.type](expression.property);
		}else{
			return parse[expression.object.type](expression.object) + "[" + parse[expression.property.type](expression.property) + "]";
		}
	}

	parse["CallExpression"] = function (expression){
		var retval = parse[expression.callee.type](expression.callee) + "(";
		for (x in expression.arguments){
			retval += parse[expression.arguments[x].type](expression.arguments[x]) + ", "
		}
		if (expression.arguments && expression.arguments.length){
			retval = retval.slice(0,-2);
		}
		retval+=")"

		return retval
	}

	parse["UnaryExpression"] = function(expression){
		if (expression.operator==='delete'){
		return expression.operator + ' ' + parse[expression.argument.type](expression.argument);

		}
		return expression.operator + parse[expression.argument.type](expression.argument);
	}

	parse["ThrowStatement"] = function(expression, instrument){
		var retval = "";
		if (instrument){ retval += addInstrumentationEvent(); }
		return retval + 'throw'
	}

	parse["BinaryExpression"] = function(expression){
		return '(' + parse[expression.left.type](expression.left) + expression.operator + parse[expression.right.type](expression.right) + ')';
	}

	parse["IfStatement"] = function(expression, instrument){
		var retval = "";
		if (instrument){ retval += addInstrumentationEvent(); }
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

	parse["SequenceExpression"] = function(expression){
		retval = "(";
		for (x in expression.expressions){
			retval += parse[expression.expressions[x].type](expression.expressions[x]) + ', ';
		}
		if (expression.expressions && expression.expressions.length>0){
			//remove trailing comma and space if needed
			retval = retval.slice(0,-2);
		}
		retval += ')';
		return retval;
	}

	parse["ImportStatement"] = function(expression){
		dottable.push(expression.from.slice(0,-4));
		return 'import "' + expression.from + '"';
	}

	parse["DeclarativeExpression"] = function(expression){
		return expression.literal.literal + ' ' + (expression.is_public ? "public " : "") + (expression.is_constant ? "constant " : "") + expression.name;
	}

	parse["ExpressionStatement"] = function(content, instrument){
		var retval = "";
		if (instrument){ retval += addInstrumentationEvent(); }
		if (content.expression.literal && content.expression.literal.literal && content.expression.literal.literal.type==="MappingExpression"){
			return retval + 'mapping (' + content.expression.literal.literal.from.literal + ' => ' + content.expression.literal.literal.to.literal + ') '+ content.expression.name;
		}else {
			return retval + parse[content.expression.type](content.expression);
		}
	}

	parse["EnumDeclaration"] = function(expression){
		var retvalue = 'enum ' + expression.name + ' {';
		dottable.push(expression.name);
		for (x in expression.members){
			retvalue += expression.members[x] + ', ';
		}
		retvalue = retvalue.slice(0,-2);
		retvalue += '}';
		return retvalue;
	}

	parse["EventDeclaration"]=function(expression){
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

	parse["VariableDeclarationTuple"] = function(expression){
		var retval = "";
		if (instrument){ retval += addInstrumentationEvent(); }

		retval += "var (";
		for (x in expression.declarations){
			retval += expression.declarations[x].id.name + ', ';
		}
		retval = retval.slice(0,-2);
		retval += ") = ";
		retval+=parse[expression.init.type](expression.init)
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
		if (expression.declarations.length>1){
			console.log('more than one declaration')
		}
		retval = "";
		if (instrument){ retval += addInstrumentationEvent(); }
		return retval + "var " + parse[expression.declarations[0].id.type](expression.declarations[0].id) + " = " + parse[expression.declarations[0].init.type](expression.declarations[0].init);
	}

	parse["Type"] = function(expression){
		return expression.literal;
	}

	parse["UsingStatement"] = function(expression){
		return "using " + expression.library + " for " + parse[expression.for.type](expression.for) + ";";
	}

	parse["FunctionDeclaration"] = function(expression){
		retval = 'function ' + (expression.name ? expression.name : "") + '('
		for (x in expression.params){
			var param = expression.params[x];
			retval += param.literal.literal + ' ' + (param.isIndexed ? 'true' : '') + param.id + ', ';
		}
		if (expression.params && expression.params.length>0){
			retval = retval.slice(0,-2);
		}
		retval += ')';
		retval += parse["Modifiers"](expression.modifiers);
		if (expression.body){
			retval+='{' + newLine('{');
			retval += parse[expression.body.type](expression.body, instrument);
			retval+='}' + newLine('}');
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

	printBody(result,0, false);

	function printBody(content, indented, cover){
		if (content.body){
			if (content.type === "ContractStatement"){
				instrumented +=  'contract ' + content.name

				if (content.is.length>0){
					instrumented += ' is '
					for (x in content.is){
						instrumented += content.is[x].name + ', '
					}
					instrumented = instrumented.slice(0,-2);
				}

				instrumented += ' {' + newLine('{');
				//Inject our coverage event if we're covering
				if (instrument){
					instrumented += "event Coverage(string fileName, uint256 lineNumber);\n"; //We're injecting this, so don't count the newline
				}

				for (x in content.body){
					printBody(content.body[x], indented+1, cover);
				}
				instrumented += '}' + newLine('}');
			}else if (content.type === "FunctionDeclaration"){
				instrumented += parse[content.type](content);
				// instrumented +=  __INDENTATION__.repeat(indented) + 'function ' + (content.name ? content.name : "") + '('
				// for (x in content.params){
				// 	var param = content.params[x];
				// 	instrumented += param.literal.literal + ' ' + (param.isIndexed ? 'true' : '') + param.id + ', ';
				// 	if (param.literal.literal==='address'){
				// 		dottable.push(param.id);
				// 	}
				// }
				// if (content.params && content.params.length>0){
				// 	instrumented = instrumented.slice(0,-2);
				// }
				// instrumented += ')';
				// instrumented += parse["Modifiers"](content.modifiers);
				// instrumented+='{' + newLine('{');
				// printBody(content.body, indented+1, instrument);
				// instrumented+=__INDENTATION__.repeat(indented) +'}' + newLine('}');
			}else if (content.type === "LibraryStatement"){
				instrumented +=  'library ' + content.name + ' {' + newLine('{');
				//Inject our coverage event;
				instrumented += "event Coverage(string fileName, uint256 lineNumber);\n"; //We're injecting this, so don't count the newline

				for (x in content.body){
					printBody(content.body[x], indented+1, cover);
				}
				instrumented += '}' + newLine('}');
			}else if (content.type === "ModifierDeclaration"){
				instrumented += 'modifier ' + content.name + '(';
				for (x in content.params){
					var param = content.params[x];
					instrumented += param.literal.literal + ' ' + (param.isIndexed ? 'true' : '') + param.id + ', ';
				}
				if (content.params && content.params.length>0){
					instrumented = instrumented.slice(0,-2);
				}
				instrumented += '){';
				instrumented += newLine(instrumented.slice(-1));
				instrumented += parse[content.body.type](content.body, instrument);
				instrumented += newLine(instrumented.slice(-1));
				instrumented +='}';
				instrumented += newLine(instrumented.slice(-1));

			}else if (content.type === "BlockStatement"){
				instrumented += parse['BlockStatement'](content, cover);
			}else if (content.type ==="Program"){
				//I don't think we need to do anything here...
				for (x in content.body){
					printBody(content.body[x], indented, cover);
				}

			}else{
				console.log(content);
				process.exit()
				for (x in content.body){
					printBody(content.body[x], indented, cover);
				}
			}
		}else{
			if (parse[content.type]!==undefined){
				if (cover){
					instrumented += __INDENTATION__.repeat(indented) +"Coverage('" + fileName + "'," + linecount + ");\n";
					runnableLines.push(linecount);
				}
				instrumented += __INDENTATION__.repeat(indented) + parse[content.type](content);
				instrumented += newLine(instrumented.slice(-1));
			}else{
				console.log(content);
			}

		}
	}



	return {contract: instrumented, runnableLines: runnableLines};

}