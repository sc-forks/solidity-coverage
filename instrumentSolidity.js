var SolidityParser = require("solidity-parser");

module.exports = function(pathToFile, instrument){

	var result = SolidityParser.parseFile("./" + pathToFile);
	var instrumented = "";
	const __INDENTATION__ = "    ";
	var parse = {};
	var linecount = 1;
	var dottable = ['msg', 'tx', 'this'];

	parse["AssignmentExpression"] = function (expression){
		var retval = "";
		retval += parse[expression.left.type](expression.left);
		retval += expression.operator;
		retval += parse[expression.right.type](expression.right);
		return retval;
	}

	parse["Identifier"] = function(expression){
		return expression.name;
	}

	parse["InformalParameter"] = function(expression){
		return expression.literal.literal;
	}

	parse["Literal"] = function(expression){
		return expression.value;
	}
	parse["Modifiers"] = function(modifiers){
		retvalue = "";
		var retModifier = null;
		for (x in modifiers){
			if (modifiers[x].name==='returns'){
				retModifier = x;
				continue;
			}else{
				console.log('unknown modifier: ', modifiers[x]);
			}
		}
		if (retModifier){
			retvalue += ' returns ('
			for (p in modifiers[retModifier].params){
				param = modifiers[retModifier].params[p];
				retvalue+= parse[param.type](param);
			}
			retvalue +=')';
		}
		return retvalue;

	}

	parse["ReturnStatement"] = function(expression){
		return 'return ' + parse[expression.argument.type](expression.argument) + ';';
	}

	parse["MemberExpression"]  = function (expression){
		if (dottable.indexOf(expression.object.name)>-1){
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

	parse["BinaryExpression"] = function(expression){
		return parse[expression.left.type](expression.left) + expression.operator + parse[expression.right.type](expression.right);
	}

	parse["IfStatement"] = function(expression){
		console.log(expression);
		var retval = "if (";
		retval += parse[expression.test.type](expression.test) + "){" + parse[expression.consequent.type](expression.consequent) + "}";
		return retval;
	}

	parse["ImportStatement"] = function(expression){
		dottable.push(expression.from.slice(0,-4));
		return 'import "' + expression.from + '"';
	}

	parse["ExpressionStatement"] = function(content){
		if (content.expression.type==="AssignmentExpression"){
			return parse["AssignmentExpression"](content.expression);
		}else if (content.expression.type==="CallExpression"){
			return parse["CallExpression"](content.expression);
		}else if(content.expression.literal.literal.type==="MappingExpression"){
			return 'mapping (' + content.expression.literal.literal.from.literal + ' => ' + content.expression.literal.literal.to.literal + ') '+ content.expression.name;
		}else{
			console.log(content);
		}
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

	parse["BlockStatement"] = function(expression){
		console.log(expression);
		return 'BLOCKSTATEMENT'
	}

	function newLine(lastchar){
		linecount+=1;
		if (['}','{',';'].indexOf(lastchar)>-1){
			return '\n';
		}else{
			return ';\n';
		}

	}

	printBody(result,0, false);

	function printBody(content, indented, cover){
		if (content.body){
			if (content.type === "ContractStatement"){
				instrumented +=  'contract ' + content.name + ' {' + newLine('{');
				//Inject our coverage event;
				instrumented += "event Coverage(string contract, uint256 lineNumber);\n"; //We're injecting this, so don't count the newline

				for (x in content.body){
					printBody(content.body[x], indented+1, cover);
				}
				instrumented += '}' + newLine('}');
			}else if (content.type === "FunctionDeclaration"){
				instrumented +=  __INDENTATION__.repeat(indented) + 'function ' + content.name + '('
				for (x in content.params){
					var param = content.params[x];
					instrumented += param.literal.literal + ' ' + (param.isIndexed ? 'true' : '') + param.id + ', ';
				}
				if (content.params && content.params.length>0){
					instrumented = instrumented.slice(0,-2);
				}
				instrumented += ')';
				instrumented += parse["Modifiers"](content.modifiers);
				instrumented+='{' + newLine('{');
				printBody(content.body, indented+1, instrument);
				instrumented+=__INDENTATION__.repeat(indented) +'}' + newLine('}');
			}else{
				for (x in content.body){
					printBody(content.body[x], indented, cover);
				}
			}
		}else{
			if (parse[content.type]!==undefined){
				if (cover){
					instrumented += __INDENTATION__.repeat(indented) +"Coverage(" + linecount + ");\n";
				}
				instrumented += __INDENTATION__.repeat(indented) + parse[content.type](content);
				instrumented += newLine(instrumented.slice(-1));
			}else{
				console.log(content);
			}

		}
	}



	return instrumented;

}