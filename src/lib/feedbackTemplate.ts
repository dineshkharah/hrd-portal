export const DEFAULT_FEEDBACK_QUESTIONS = [
  { questionText: "Overall event rating", questionType: "star_rating" as const, isRequired: true, displayOrder: 0 },
  { questionText: "Quality of content", questionType: "star_rating" as const, isRequired: true, displayOrder: 1 },
  { questionText: "Speaker / Presenter rating", questionType: "star_rating" as const, isRequired: true, displayOrder: 2 },
  { questionText: "Time management", questionType: "star_rating" as const, isRequired: true, displayOrder: 3 },
  { questionText: "Venue / Platform experience", questionType: "star_rating" as const, isRequired: true, displayOrder: 4 },
  { questionText: "Organisation and coordination", questionType: "star_rating" as const, isRequired: true, displayOrder: 5 },
  { questionText: "Communication before the event", questionType: "star_rating" as const, isRequired: true, displayOrder: 6 },
  { questionText: "Would you attend this event again?", questionType: "yes_no" as const, isRequired: true, displayOrder: 7 },
  { questionText: "What did you like most?", questionType: "long_text" as const, isRequired: false, displayOrder: 8 },
  { questionText: "Areas of improvement", questionType: "long_text" as const, isRequired: false, displayOrder: 9 },
  { questionText: "Additional suggestions", questionType: "long_text" as const, isRequired: false, displayOrder: 10 },
];
