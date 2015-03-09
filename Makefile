# Commands
NODE_CMD = node_modules/.bin/babel-node
MYTH_CMD = node_modules/.bin/myth

# Directories
SRC_DIR = src/
DIST_DIR = dist/

# Git
REPO_GIT = git@github.com:micro-api/micro-media-type.git
CNAME = micro-api.org

# Phonies
.PHONY: build clean deploy


all: build


build:
	mkdir -p $(DIST_DIR) $(DIST_DIR)assets
	cp -rf $(SRC_DIR)assets $(DIST_DIR)
	echo $(CNAME) > $(DIST_DIR)CNAME
	$(MYTH_CMD) -c $(SRC_DIR)css/index.css $(DIST_DIR)assets/index.css
	$(NODE_CMD) $(SRC_DIR)build


clean:
	rm -rf $(DIST_DIR)


# Deploying to GitHub pages.
deploy:
	(cd dist; \
		[ ! -d .git ] && \
			git init && \
			git remote add origin $(REPO_GIT) && \
			git branch gh-pages; \
		# git pull origin gh-pages && \
		# git checkout gh-pages && \
		git add -A && \
		git commit -m 'Update website from Makefile.' && \
		git push -u --force origin gh-pages)
