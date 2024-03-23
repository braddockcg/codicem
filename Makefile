all: frontend/dist/codicem-bundle.js

frontend/dist/codicem-bundle.js: frontend/src/*.ts frontend/src/index.html
	npx webpack

clean:
	rm -vf frontend/dist/*
	rm -rfv frontend/build/*

