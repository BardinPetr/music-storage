module.exports = {
  index: 'music-storage',
  body: {
    properties: {
      id: {
        type: 'keyword',
      },
      ext: {
        type: 'keyword',
      },
      text: {
        type: 'text',
        fields: {
          trigram: {
            type: 'text',
            analyzer: 'trigram',
          },
          reverse: {
            type: 'text',
            analyzer: 'reverse',
          },
          default: {
            type: 'text',
            analyzer: 'default',
          },
        },
      },
      name: {
        type: 'text',
      },
      author: {
        type: 'text',
      },
      title: {
        type: 'text',
        fields: {
          trigram: {
            type: 'text',
            analyzer: 'trigram',
          },
          reverse: {
            type: 'text',
            analyzer: 'reverse',
          },
          // d: {
          //   type: 'text',
          //   analyser: 'default',
          // },
        },
      },
    },
  },
};