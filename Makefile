install:
	npm install

publish:
	npm publish --dry-run

link: 
	sudo npm link

lint:
	npx eslint .

lint-fix:
	npx eslint --fix .;

test:
	npm test

test-coverage:
	npm test -- --coverage --coverageProvider=v8

develop:
	npx webpack serve

build:
	rm -rf dist
	NODE_ENV=production npx webpack
