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
