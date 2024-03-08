all: frontend/dist/codicem-bundle.js

frontend/dist/codicem-bundle.js: frontend/src/*.ts frontend/src/index.html
	npx webpack

clean:
	rm -v frontend/dist/codicem-bundle.js
	rm -v frontend/build/*.js

