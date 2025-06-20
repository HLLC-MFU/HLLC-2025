package utils

import "regexp"

var mentionPattern = regexp.MustCompile(`@(\w+)`)

func ExtractMentions(text string) []string {
	matches := mentionPattern.FindAllStringSubmatch(text, -1)
	var mentions []string
	for _, match := range matches {
		mentions = append(mentions, match[1])
	}
	return mentions
}
