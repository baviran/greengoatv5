import React from 'react';
// import { SimpleEditor } from '@/app/components/tiptap/components/tiptap-templates/simple/simple-editor'
import { SimpleEditor } from '@/app/components/tiptap/tiptap-templates/simple/simple-editor';

// Option 2: Browser-only (lightweight)
// import { generateHTML } from '@tiptap/core'
import Bold from '@tiptap/extension-bold'
import Document from '@tiptap/extension-document'
import Paragraph from '@tiptap/extension-paragraph'
import Text from '@tiptap/extension-text'
import Heading from '@tiptap/extension-heading'
import Italic from "@tiptap/extension-italic";
import Highlight from "@tiptap/extension-highlight";
import Link from '@tiptap/extension-link';
import Strike from "@tiptap/extension-strike";
import Blockquote from "@tiptap/extension-blockquote";
import Image from '@tiptap/extension-image';
import Superscript from "@tiptap/extension-superscript";
import Subscript from "@tiptap/extension-subscript";
import ListItem from "@tiptap/extension-list-item";
import BulletList from "@tiptap/extension-bullet-list";
import HorizontalRule from "@tiptap/extension-horizontal-rule";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { generateHTML } from '@tiptap/html'

const content = {
    "type": "doc",
    "content": [
        {
            "type": "heading",
            "attrs": {
                "textAlign": "right",
                "level": 1
            },
            "content": [
                {
                    "type": "text",
                    "text": "מתחילים עם בנייה ירוקה"
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": "right"
            },
            "content": [
                {
                    "type": "text",
                    "text": "ברוכים הבאים לתבנית ה-"
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "italic"
                        },
                        {
                            "type": "highlight",
                            "attrs": {
                                "color": "var(--tt-color-highlight-green)"
                            }
                        }
                    ],
                    "text": "עורך הפשוט לבנייה ירוקה"
                },
                {
                    "type": "text",
                    "text": "! תבנית זו משלבת "
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "bold"
                        }
                    ],
                    "text": "רכיבי ממשק קוד פתוח"
                },
                {
                    "type": "text",
                    "text": " והרחבות Tiptap תחת רישיון "
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "bold"
                        }
                    ],
                    "text": "MIT"
                },
                {
                    "type": "text",
                    "text": "."
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": "right"
            },
            "content": [
                {
                    "type": "text",
                    "text": "ניתן לשלב את התבנית על ידי מעקב אחר "
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "link",
                            "attrs": {
                                "href": "https://example.com/green-building-docs",
                                "target": "_blank",
                                "rel": "noopener noreferrer nofollow",
                                "class": null
                            }
                        }
                    ],
                    "text": "תיעוד בנייה ירוקה"
                },
                {
                    "type": "text",
                    "text": " או באמצעות כלי ה-CLI שלנו."
                }
            ]
        },
        {
            "type": "heading",
            "attrs": {
                "textAlign": "right",
                "level": 2
            },
            "content": [
                {
                    "type": "text",
                    "text": "תכונות עיקריות"
                }
            ]
        },
        {
            "type": "blockquote",
            "content": [
                {
                    "type": "paragraph",
                    "attrs": {
                        "textAlign": "right"
                    },
                    "content": [
                        {
                            "type": "text",
                            "marks": [
                                {
                                    "type": "italic"
                                }
                            ],
                            "text": "עורך טקסט עשיר ורספונסיבי לחלוטין עם תמיכה מובנית בכלי עיצוב ופריסה נפוצים. כתוב בפורמט Markdown "
                        },
                        {
                            "type": "text",
                            "marks": [
                                {
                                    "type": "italic"
                                }
                            ],
                            "text": " או השתמש בקיצורי מקלדת "
                        },
                        {
                            "type": "text",
                            "text": " עבור "
                        },
                        {
                            "type": "text",
                            "marks": [
                                {
                                    "type": "strike"
                                }
                            ],
                            "text": "רוב"
                        },
                        {
                            "type": "text",
                            "text": " סימוני ה-Markdown הנפוצים. ♻️"
                        }
                    ]
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": "right"
            },
            "content": [
                {
                    "type": "text",
                    "text": "הוסף תמונות, התאם יישור, ויישם "
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "highlight",
                            "attrs": {
                                "color": "var(--tt-color-highlight-blue)"
                            }
                        }
                    ],
                    "text": "עיצובים מתקדמים"
                },
                {
                    "type": "text",
                    "text": " כדי להפוך את הכתיבה שלך למעניינת ומקצועית יותר."
                }
            ]
        },
        {
            "type": "image",
            "attrs": {
                "src": "/images/green-building-placeholder.svg",
                "alt": "בניין ירוק",
                "title": "איור בניין ירוק"
            }
        },
        {
            "type": "bulletList",
            "content": [
                {
                    "type": "listItem",
                    "content": [
                        {
                            "type": "paragraph",
                            "attrs": {
                                "textAlign": "right"
                            },
                            "content": [
                                {
                                    "type": "text",
                                    "marks": [
                                        {
                                            "type": "bold"
                                        }
                                    ],
                                    "text": "כתב עילי"
                                },
                                {
                                    "type": "text",
                                    "text": " (CO"
                                },
                                {
                                    "type": "text",
                                    "marks": [
                                        {
                                            "type": "superscript"
                                        }
                                    ],
                                    "text": "2"
                                },
                                {
                                    "type": "text",
                                    "text": ") ו-"
                                },
                                {
                                    "type": "text",
                                    "marks": [
                                        {
                                            "type": "bold"
                                        }
                                    ],
                                    "text": "כתב תחתי"
                                },
                                {
                                    "type": "text",
                                    "text": " (H"
                                },
                                {
                                    "type": "text",
                                    "marks": [
                                        {
                                            "type": "subscript"
                                        }
                                    ],
                                    "text": "2"
                                },
                                {
                                    "type": "text",
                                    "text": "O) לדיוק מדעי."
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "listItem",
                    "content": [
                        {
                            "type": "paragraph",
                            "attrs": {
                                "textAlign": "right"
                            },
                            "content": [
                                {
                                    "type": "text",
                                    "marks": [
                                        {
                                            "type": "bold"
                                        }
                                    ],
                                    "text": "המרה טיפוגרפית"
                                },
                                {
                                    "type": "text",
                                    "text": ": המרה אוטומטית של "
                                },
                                {
                                    "type": "text",
                                    "text": "לחץ "
                                },
                                {
                                    "type": "text",
                                    "marks": [
                                        {
                                            "type": "bold"
                                        }
                                    ],
                                    "text": "⟶"
                                },
                                {
                                    "type": "text",
                                    "text": "."
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": "right"
            },
            "content": [
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "italic"
                        }
                    ],
                    "text": "⟶ "
                },
                {
                    "type": "text",
                    "marks": [
                        {
                            "type": "link",
                            "attrs": {
                                "href": "https://example.com/green-building-features",
                                "target": "_blank",
                                "rel": "noopener noreferrer nofollow",
                                "class": null
                            }
                        }
                    ],
                    "text": "למד עוד"
                }
            ]
        },
        {
            "type": "horizontalRule"
        },
        {
            "type": "heading",
            "attrs": {
                "textAlign": "right",
                "level": 2
            },
            "content": [
                {
                    "type": "text",
                    "text": "התאם אישית"
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": "right"
            },
            "content": [
                {
                    "type": "text",
                    "text": "עבור בין מצבי בהיר וכהה, והתאם את מראה העורך עם CSS הניתן להתאמה אישית כדי להתאים לסגנון שלך."
                }
            ]
        },
        {
            "type": "taskList",
            "content": [
                {
                    "type": "taskItem",
                    "attrs": {
                        "checked": true
                    },
                    "content": [
                        {
                            "type": "paragraph",
                            "attrs": {
                                "textAlign": "right"
                            },
                            "content": [
                                {
                                    "type": "text",
                                    "text": "בדיקת תבנית בנייה ירוקה"
                                }
                            ]
                        }
                    ]
                },
                {
                    "type": "taskItem",
                    "attrs": {
                        "checked": false
                    },
                    "content": [
                        {
                            "type": "paragraph",
                            "attrs": {
                                "textAlign": "right"
                            },
                            "content": [
                                {
                                    "type": "text",
                                    "marks": [
                                        {
                                            "type": "link",
                                            "attrs": {
                                                "href": "https://example.com/integrate-green-template",
                                                "target": "_blank",
                                                "rel": "noopener noreferrer nofollow",
                                                "class": null
                                            }
                                        }
                                    ],
                                    "text": "שלב את תבנית הבנייה הירוקה"
                                }
                            ]
                        }
                    ]
                }
            ]
        },
        {
            "type": "paragraph",
            "attrs": {
                "textAlign": "right"
            }
        }
    ]
};

// Generate HTML from JSON

const x = generateHTML(
    content,
    [
        Document,
        Paragraph,
        Text,
        Bold,
        Heading,
        Italic,
        Highlight,
        Link,
        Strike,
        Blockquote,
        Image,
        Superscript,
        Subscript,
        ListItem,
        BulletList,
        HorizontalRule,
        TaskItem,
        TaskList
    ],
)

console.log("x",x)

const EditorColumn: React.FC = () => {
    return (
        <div className="h-full p-4 sm:p-6 bg-card border-l border-border rtl:border-r rtl:border-l-0 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <SimpleEditor />

        </div>
    );
};

export default EditorColumn;
