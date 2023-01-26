import { EventManager } from "@bluelibs/core";
import { addExpanders, addLinks, addReducers } from "@bluelibs/nova";
import {
  ITimestampableBehaviorOptions,
  BehaviorType,
  ITranslatableBehaviorOptions,
} from "../defs";
import { Collection } from "../models/Collection";
import {
  BeforeInsertEvent,
  BeforeUpdateEvent,
  AfterUpdateEvent,
} from "../events";

function i18nField(field: string) {
  return `${field}_i18n`;
}

function i18nFindByLocale(
  i18nField: Array<{ locale: string; value: string }>,
  locale: string
): string {
  return i18nField.find((item) => item.locale === locale)?.value;
}

/**
 * Stores the translations into the i18nField
 * @param i18nField
 * @param locale
 * @param value
 * @returns
 */
function storeI18NByLocale(
  i18nField: Array<{ locale: string; value: string }>,
  locale: string,
  value: string
) {
  let found = false;
  i18nField.forEach((item) => {
    if (item.locale === locale) {
      item.value = value;
      found = true;
    }
  });

  if (!found) {
    i18nField.push({ locale, value });
  }
}

function cleanI18N(result: any | any[], fields: string[], locale: string) {
  if (Array.isArray(result)) {
    result.forEach((item) => {
      cleanI18N(item, fields, locale);
    });
  } else {
    fields.forEach((field) => {
      if (result[i18nField(field)]) {
        result[field] = i18nFindByLocale(result[i18nField(field)], locale);
        delete result[i18nField(field)];
      }
    });
  }
}

const STORAGE = Symbol("i18n");

export default function translatable(
  i18nBehaviorOptions: ITranslatableBehaviorOptions
): BehaviorType {
  return (collection: Collection<any>) => {
    collection.onInit(() => {
      // Add reducers for the fields for easy finding
      i18nBehaviorOptions.fields.forEach((field) => {
        addReducers(collection.collection, {
          [field]: {
            dependency: {
              [field]: 1,
              [i18nField(field)]: 1,
            },
            reduce(object, params) {
              const locale =
                params.context?.locale || i18nBehaviorOptions.defaultLocale;

              let value = i18nFindByLocale(object[i18nField(field)], locale);
              return value || object[field];
            },
          },
        });
      });

      // Manipulate before insert and before update to store the i18n fields accordingly:
      collection.localEventManager.addListener(
        BeforeInsertEvent,
        (e: BeforeInsertEvent) => {
          const document = e.data.document;
          i18nBehaviorOptions.fields.forEach((field) => {
            // if translatable field is set, store it based on the locale from the context
            if (document[field] !== undefined) {
              document[i18nField(field)] = document[i18nField(field)] || [];
              storeI18NByLocale(
                document[i18nField(field)],
                e.data.context.locale || i18nBehaviorOptions.defaultLocale,
                document[field]
              );
              delete document[field];
            }
          });
        }
      );

      collection.localEventManager.addListener(
        BeforeUpdateEvent,
        async (e: BeforeUpdateEvent) => {
          // only works with $set
          if (!e.data.update.$set) {
            return;
          }

          // We have to verify if there are any changes to translation fields
          // If there are, we have to update the i18n fields accordingly

          // We have to ensure that we don't override pre-existing data in the i18n fields in the database
          // It is not enough to just update it from here, we have to also modify the database somehow

          // We can mark the fields somehow, clean the model, and somehow pass data so when it reaches AfterUpdateEvent
          // we can update the i18n fields accordingly and save it to the database

          const usedI18NFields = i18nBehaviorOptions.fields.filter((field) => {
            return e.data.fields.top.find((f) => f === field) !== undefined;
          });

          // No i18n fields are used, we can skip this
          if (usedI18NFields.length === 0) {
            return;
          }

          // find the real data for their i18n in the database and merge it with the data we have
          // so we can update the i18n fields accordingly
          const i18nData = await collection.collection.findOne(e.data.filter, {
            projection: {
              _id: 0,
              ...usedI18NFields.reduce((acc, field) => {
                acc[i18nField(field)] = 1;
                return acc;
              }, {}),
            },
          });

          // merge the i18n data with the data we have
          usedI18NFields.forEach((field) => {
            storeI18NByLocale(
              i18nData[i18nField(field)],
              e.data.context.locale || i18nBehaviorOptions.defaultLocale,
              // @ts-ignore
              e.data.update.$set[field]
            );

            if (e.data.update.$set) {
              // @ts-ignore
              e.data.update.$set[i18nField(field)] =
                i18nData[i18nField(field)] || [];

              // @ts-ignore
              delete e.data.update.$set[field];
            }
          });
        }
      );
    });
  };
}
