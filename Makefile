# Commands
LINT_CMD = node_modules/.bin/eslint
CSS_CMD = node_modules/.bin/cssnext
NODE_CMD = node_modules/.bin/babel-node

# Directories
SRC_DIR = src/
DIST_DIR = dist/

# Git
REPO_GIT = git@github.com:micro-api/micro-api.git
CNAME = micro-api.org

# Phonies
.PHONY: build clean deploy lint


all: lint build


build:
	mkdir -p $(DIST_DIR) $(DIST_DIR)assets
	cp -rf $(SRC_DIR)assets $(DIST_DIR)
	echo $(CNAME) > $(DIST_DIR)CNAME
	$(CSS_CMD) $(SRC_DIR)css/index.css $(DIST_DIR)assets/index.css
	$(NODE_CMD) $(SRC_DIR)build


clean:
	rm -rf $(DIST_DIR)


lint:
	$(LINT_CMD) $(SRC_DIR)


# Deploying to GitHub pages.
deploy:
	(cd dist; \
		[ ! -d .git ] && \
			git init && \
			git remote add origin $(REPO_GIT) && \
			git fetch origin gh-pages && \
			git branch gh-pages; \
		git add -A && \
		git commit -m 'Update website from Makefile.' && \
		git push --force origin HEAD:gh-pages)
