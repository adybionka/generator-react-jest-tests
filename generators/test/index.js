'use strict';
var Generator = require('yeoman-generator');
var yosay = require('yosay');
var fs = require('fs');
var path = require('path');
var read = require('fs-readdir-recursive');
var reactDocs = require('react-docgen');
var debug = require('debug');
const prettier = require('prettier');

const log = debug('generator-react-jest-tests:log');
const error = debug('generator-react-jest-tests:error');

const _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];
    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }
  return target;
};

const filenameFromPath = filePath => {
  log('filenameFromPath ', filePath);
  const filePathNoExtension = filePath.split('.js');
  const filePathNoExtensionArray = filePathNoExtension[0].split('/');
  const filename = filePathNoExtensionArray[filePathNoExtensionArray.length - 1];
  return filename;
};

const generateFakeProp = ({propName, name, value, raw}) => {
  log('generateFakeProp ', {propName, name, value, raw});
  const isShape = typeof (value) === 'object';

  if (isShape) {
    const fakeShape = {};

    Object.keys(value).forEach(shapeChildName => {
      const fakeProp = generateFakeProp({propName, name: shapeChildName, value: value[shapeChildName].name});
      const fakePropName = fakeProp.name;
      const fakePropValue = fakeProp.value;
      fakeShape[fakePropName] = fakePropValue;
    });

    return {propName, name, value: fakeShape};
  }

  switch (value) {
    case 'number':
      return {name, value: 42};
    case 'string':
      return {name, value: '"lorem ipsum"'};
    case 'bool':
      return {name, value: true};
    case 'array':
      return {name, value: '[]'};
    case 'node':
      return {name, value: '<div>Some node</div>'};
    default:
      switch (name) {
        case 'func':
          return {name, value: '() => {}'};
        case 'number':
          return {name, value: 42};
        case 'string':
          return {name, value: '"lorem ipsum"'};
        case 'bool':
          return {name, value: true};
        case 'array':
          return {name, value: '[]'};
        case 'node':
          return {name, value: '<div>Some node</div>'};
        default:
          switch (raw && raw.replace('.isRequired', '')) {
            case 'PropTypes.func':
              return {name, value: '() => {}'};
            case 'PropTypes.number':
              return {name, value: 42};
            case 'PropTypes.string':
              return {name, value: '"lorem ipsum"'};
            case 'PropTypes.bool':
              return {name, value: true};
            case 'PropTypes.array':
              return {name, value: '[]'};
            case 'RomanPropTypes.CardData':
              return {name, value: 'cardData'};
            case 'RomanPropTypes.Doctor':
              return {name, value: 'doctor'};
            case 'RomanPropTypes.DraftUser':
              return {name, value: 'draftUser'};
            case 'RomanPropTypes.Member':
              return {name, value: 'member'};
            case 'RomanPropTypes.Order':
              return {name, value: 'order'};
            case 'RomanPropTypes.Pharmacist':
              return {name, value: 'pharmacist'};
            case 'RomanPropTypes.Plan':
              return {name, value: 'plan'};
            case 'RomanPropTypes.PlanListItem':
              return {name, value: 'planListItem'};
            case 'RomanPropTypes.Prescription':
              return {name, value: 'prescription'};
            case 'RomanPropTypes.Product':
              return {name, value: 'product'};
            case 'RomanPropTypes.Tracker':
              return {name, value: 'tracker'};
            case 'RomanPropTypes.TrackerPlan':
              return {name, value: 'trackerPlan'};
            case 'RomanPropTypes.TreatmentRecommendation':
              return {name, value: 'treatmentRecommendation'};
            case 'RomanPropTypes.TreatmentRecommendationItem':
              return {name, value: 'treatmentRecommendationItem'};
            case 'RomanPropTypes.TreatmentRequest':
              return {name, value: 'treatmentRequest'};
            case 'RomanPropTypes.TreatmentRequestItem':
              return {name, value: 'treatmentRequestItem'};
            case 'RomanPropTypes.User':
              return {name, value: 'user'};

            case 'node':
              return {name, value: '<div>Some node</div>'};
            default:
              return {name, value: '{}'};
          }
      }
  }
};

const getTestDataImport = type => {
  if (!type.raw) {
    return null;
  }

  switch (type.raw.replace('.isRequired', '')) {
    case 'RomanPropTypes.CardData':
      return 'import cardData from \'roman-shared/src/cardData/testData/cardData.json\'';
    case 'RomanPropTypes.Doctor':
      return 'import doctor from \'roman-shared/src/user/testData/doctor.json\'';
    case 'RomanPropTypes.DraftUser':
      return 'import draftUser from \'roman-shared/src/user/testData/draftUser.json\'';
    case 'RomanPropTypes.Member':
      return 'import member from \'roman-shared/src/user/testData/member.json\'';
    case 'RomanPropTypes.Order':
      return 'import order from \'roman-shared/src/order/testData/order.json\'';
    case 'RomanPropTypes.Pharmacist':
      return 'import pharmacist from \'roman-shared/src/user/testData/pharmacist.json\'';
    case 'RomanPropTypes.Plan':
      return 'import plan from \'roman-shared/src/plan/testData/plan.json\'';
    case 'RomanPropTypes.PlanListItem':
      return 'import planListItem from \'roman-shared/src/plan/testData/planListItem.json\'';
    case 'RomanPropTypes.Prescription':
      return 'import prescription from \'roman-shared/src/prescription/testData/prescription.json\'';
    case 'RomanPropTypes.Product':
      return 'import product from \'roman-shared/src/product/testData/product.json\'';
    case 'RomanPropTypes.Tracker':
      return 'import tracker from \'roman-shared/src/tracker/testData/tracker.json\'';
    case 'RomanPropTypes.TrackerPlan':
      return 'import trackerPlan from \'roman-shared/src/tracker/testData/trackerPlan.json\'';
    case 'RomanPropTypes.TreatmentRecommendation':
      return 'import treatmentRecommendation from \'roman-shared/src/treatment-recommendation/testData/treatmentRecommendation.json\'';
    case 'RomanPropTypes.TreatmentRecommendationItem':
      return 'import treatmentRecommendationItem from \'roman-shared/src/treatment-recommendation/testData/treatmentRecommendationItem.json\'';
    case 'RomanPropTypes.TreatmentRequest':
      return 'import treatmentRequest from \'roman-shared/src/treatment-request/testData/treatmentRequest.json\'';
    case 'RomanPropTypes.TreatmentRequestItem':
      return 'import treatmentRequestItem from \'roman-shared/src/treatment-request/testData/treatmentRequestItem.json\'';
    case 'RomanPropTypes.User':
      return 'import user from \'roman-shared/src/user/testData/user.json\'';

    default:
      return null;
  }
};

const extractDefaultProps = (filePath, currentFilePath) => {
  log('extractDefaultProps ', {filePath, currentFilePath});
  const filename = filenameFromPath(filePath); // filePathNoExtensionArray[filePathNoExtensionArray.length - 1];
  const fileString = fs.readFileSync(filePath, 'utf8');
  let componentInfo;

  try {
    componentInfo = reactDocs.parse(fileString);
  } catch (err) {
    // console.log(filePath, 'is not a React Component, ');
    throw new Error(err);
  }

  const componentProps = [];
  const testDataImports = [];
  let hasChildren = false;
  const componentHasProps = componentInfo.props ? componentInfo.props : false;

  if (!componentHasProps) {
    error('No props found in ', filename, ' at ', filePath);
    return {
      componentInfo,
      componentProps,
      currentFilePath,
      filename,
      filePath,
      hasChildren,
      testDataImports
    };
  }

  const propNames = Object.keys(componentInfo.props);

  for (let i = 0; i < propNames.length; i += 1) {
    const propName = propNames[i];

    if (propName === 'children') {
      hasChildren = true;
      continue;
    }

    let propType;

    if (componentInfo.props[propName].type) {
      propType = componentInfo.props[propName].type.name;
    } else {
      error('propType not set for ' + propName + ' in ' + filename + ' at ' + currentFilePath + ' consider setting it in propTypes');
      propType = 'string';
    }

    let propDefaultValue;

    const hasDefaultvalue = componentInfo.props[propName].defaultValue ? componentInfo.props[propName].defaultValue : false;

    if (hasDefaultvalue) {
      error(componentInfo.props[propName].defaultValue);
      propDefaultValue = componentInfo.props[propName].defaultValue.value; // ? componentInfo.props[currentProp] : '-1';

      error({propName, propType, propDefaultValue});
    } else {
      error('defaultProps value not set for ' + propName + ' in ' + filename + ' at ' + currentFilePath + ' consider setting it  in defaultProps');
      error('!!! Will try to generate fake data this might cause unexpected results !!!');
      const {type} = componentInfo.props[propName];
      const {name, value, raw} = type;

      // if (required) {
      const fakeProp = generateFakeProp({propName, name, value, raw});
      propDefaultValue = fakeProp.value;
      log('Generated ', fakeProp, 'returning it as ', {propName, propType, propDefaultValue, currentFilePath});
      // }
    }

    if (propType === 'string') {
      propDefaultValue = propDefaultValue.replace(/^(')/, '"');
      propDefaultValue = propDefaultValue.replace(/(')$/, '"');

      if (/^".*"$/.test(propDefaultValue) === false) {
        propDefaultValue = `{${propDefaultValue}}`;
      }
    }

    componentProps.push({propName, propType, propDefaultValue, currentFilePath});
    // process.exit();

    const {type} = componentInfo.props[propName];

    if (type) {
      const testDataImport = getTestDataImport(type);

      if (testDataImport && !testDataImports.includes(testDataImport)) {
        testDataImports.push(testDataImport);
      }
    }
  }

  return {
    componentInfo,
    componentProps,
    currentFilePath,
    filename,
    filePath,
    hasChildren,
    testDataImports
  };
};

module.exports = class extends Generator {
  constructor(args, opts) {
    super(args, opts);
    this.option('prettify', {
      descr: 'If true, lint code with prettify',
      alias: 'pr',
      type: Boolean,
      default: false,
      hide: false
    });
    this.option('template', {
      desc: 'Custom template to use for tests',
      alias: 't',
      type: String,
      default: '',
      hide: false
    });
  }
  prompting() {
    if (this.options.template.length) {
      this.log(`Received custom template of: ${this.options.template}`);
    }
    this.log(yosay('Let\'s create tests'));
    var prompts = [
      {
        type: 'input',
        name: 'COMPONENTS_PATH',
        message: 'Give me the path to components please !',
        default: './'
      }
    ];
    if (this.options.isNested) {
      this.props = this.options.props;
    } else {
      return this.prompt(prompts).then(function (props) {
        this.props = props;
      }.bind(this));
    }
  }
  writing() {
    const filePaths = read(this.props.COMPONENTS_PATH).filter(filename => filename.endsWith('.js'));
    if (filePaths.length === 0) {
      const noJsMessage = 'Did not find any .js files';
      console.log(noJsMessage);
      error(noJsMessage);
    }
    const metadata = [];
    for (let i = 0; i < filePaths.length; i += 1) {
      const currentFilePath = filePaths[i];
      const completeFilePath = this.props.COMPONENTS_PATH + currentFilePath;
      try {
        const componentInfo = extractDefaultProps(completeFilePath, currentFilePath);
        metadata.push(componentInfo);
      } catch (err) {
        error('Couldnt extractDefaultProps from ' + currentFilePath + ' at ' + completeFilePath);
        error(err);
        // process.exit();
      }
    }

    for (let i = 0; i < metadata.length; i += 1) {
      const compMetaData = metadata[i];
      const testPath = path.resolve(compMetaData.filePath, path.join('..', compMetaData.filename + '.test.js'));
      const templatePath = this.options.template.length ? path.join(this.sourceRoot('.'), this.options.template) : 'index.template.js';
      this.fs.copyTpl(
        this.templatePath(templatePath),
        this.destinationPath(testPath),
        _extends({}, compMetaData, {relativeFilePath: `./${compMetaData.filename}`})
      );
      try {
        const generatedTestCode = this.fs.read(testPath);
        const formattedTestCode = this.options.prettify ? prettier.format(generatedTestCode, {
          singleQuote: true,
          trailingComma: 'all'
        }) : generatedTestCode;
        this.fs.write(testPath, formattedTestCode);
      } catch (err) {
        error('Couldnt lint generated code :( from ' + compMetaData);
      }
    }
  }
};
