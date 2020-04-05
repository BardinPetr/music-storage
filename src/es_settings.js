module.exports = {
  index: 'music-storage',
  body: {
    index: {
      analysis: {
        filter: {
          ru_stop: {
            type: 'stop',
            stopwords: '_russian_',
          },
          ru_stemmer: {
            type: 'stemmer',
            language: 'russian',
          },
          en_stop: {
            type: 'stop',
            stopwords: '_english_',
          },
          en_stemmer: {
            type: 'stemmer',
            language: 'english',
          },
          shingle: {
            type: 'shingle',
            min_shingle_size: 2,
            max_shingle_size: 3,
          },
        },
        analyzer: {
          default: {
            char_filter: ['html_strip'],
            tokenizer: 'standard',
            filter: [
              'trim',
              'asciifolding',
              'lowercase',
              'ru_stop',
              'ru_stemmer',
              'en_stop',
              'en_stemmer',
            ],
          },
          // title_analyser: {
          //   type: 'custom',
          //   char_filter: ['html_strip'],
          //   tokenizer: 'standard',
          //   filter: [
          //     'trim',
          //     'asciifolding',
          //     'lowercase',
          //   ],
          // },
          trigram: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'shingle'],
          },
          reverse: {
            type: 'custom',
            tokenizer: 'standard',
            filter: ['lowercase', 'reverse'],
          },
        },
      },
    },
  },
};