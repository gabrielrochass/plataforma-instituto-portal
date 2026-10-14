import { createCn } from "cn/config";

export const cn = createCn({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "caption2",
            "caption",
            "footnote",
            "subhead",
            "body",
            "headline",
            "title3",
            "title2",
            "title1",
            "large-title",
            "display",
            "hero",
          ],
        },
      ],
    },
  },
});
