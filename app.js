const _ = require('lodash');
const commandLineArgs = require('command-line-args');
const fs = require('fs');
const JSON5 = require('json5');
const newman = require('newman');
const prompt = require('prompt');

const optionDefinitions = [
  { name: 'collection', alias: 'c', type: String, defaultValue: 'main' },
  { name: 'environment', alias: 'e', type: String, defaultValue: 'krg.io' }
];

const options = commandLineArgs(optionDefinitions);

const promptSchema = {
  properties: {
    publisher_name: {
      description: 'Publisher name',
      type: 'string',
      required: true
    },
    num_properties: {
      description: 'How many Properties',
      type: 'number',
      required: true,
      default: 1
    }
  }
};

prompt.message = 'KM Seeder';
prompt.start();
prompt.get(promptSchema, (error, result) => {
  if (error){
    throw error;
  }

  run(result);
});

const run = function run(inputs) {
  const envFile = `environments/${options.environment}.json`;
  const envJson = JSON5.parse(fs.readFileSync(envFile, "utf-8"));

  const globalsFile = `globals.json`;
  const globalsJson = JSON5.parse(fs.readFileSync(globalsFile, "utf-8"));
  globalsJson.values = [
    {
      "key": 'publisher_name',
      "type": "text",
      "value": inputs.publisher_name,
      "enabled": true
    }
  ];

  const collectionJson = buildCollection(inputs.num_properties);

  const newmanOptions = {
    collection: collectionJson,
    environment: envJson,
    globals: globalsJson,
    reporters: ['cli'],
    outputFileVerbose: true
  };

  newman.run(newmanOptions, (error, summary) => {
    if (error) {
      throw error;
    }

    console.log("Done seeding data.");
  });
};

const buildCollection = function buildCollection(numProperties) {
  const collection = JSON5.parse(fs.readFileSync('collections/base.json', 'utf8'));

  const createPublisher = JSON5.parse(fs.readFileSync('collections/parts/create-publisher.json', 'utf8'));
  const createProperty = JSON5.parse(fs.readFileSync('collections/parts/create-property.json', 'utf8'));
  const createAdSlots = JSON5.parse(fs.readFileSync('collections/parts/create-ad-slots.json', 'utf8'));

  collection.item = [
    createPublisher
  ];

  _.times(numProperties, (index) => {
    const currentProperty = _.cloneDeep(createProperty);
    currentProperty.request.body.raw = currentProperty.request.body.raw.replace('{{property_counter}}', index + 1);

    collection.item.push(currentProperty);

    createAdSlots.forEach((item) => {
      collection.item.push(item);
    });
  });

  return collection;
};