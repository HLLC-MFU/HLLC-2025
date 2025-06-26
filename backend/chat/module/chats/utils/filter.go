package utils

import (
	"regexp"
	"strings"
	"unicode/utf8"

	censor "github.com/HLLC-MFU/HLLC-2025/backend/module/chats/utils/censor"
)

var badWords = append(censor.EnCensorWordsList,
	censor.ThCensorWordsList...,
)

// Add more Thai and English words as needed

// FilterProfanity replaces bad words with asterisks
func FilterProfanity(message string) string {
	// Use a regex pattern that works for both Thai and English
	for _, word := range badWords {
		pattern := regexp.QuoteMeta(word)
		re := regexp.MustCompile(`(?i)` + pattern)

		// Replace each bad word with asterisks
		message = re.ReplaceAllStringFunc(message, func(match string) string {
			return strings.Repeat("*", utf8.RuneCountInString(match))
		})
	}

	return message
}

// AddBadWord adds a new bad word to the filter list
func AddBadWord(word string) {
	badWords = append(badWords, word)
}

// RemoveBadWord removes a bad word from the filter list
func RemoveBadWord(word string) {
	for i, w := range badWords {
		if w == word {
			badWords = append(badWords[:i], badWords[i+1:]...)
			break
		}
	}
}
