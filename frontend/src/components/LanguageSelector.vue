<template>
  <div class="language-selector">
    <Dropdown
      v-model="selectedLocale"
      :options="languages"
      optionLabel="name"
      optionValue="code"
      @change="changeLanguage"
      class="lang-dropdown"
    >
      <template #value="slotProps">
        <div class="lang-value" v-if="slotProps.value">
          <span>{{ slotProps.value.toUpperCase() }}</span>
        </div>
      </template>
      <template #option="slotProps">
        <div class="lang-option">
          <span>{{ slotProps.option.name }}</span>
        </div>
      </template>
    </Dropdown>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { usePrimeVue } from 'primevue/config';
import Dropdown from 'primevue/dropdown';
import { saveLocale, updateHtmlLang } from '@/i18n';

const { locale } = useI18n();
const primevue = usePrimeVue();

const languages = [
  { code: 'en', name: 'English' },
  { code: 'sv', name: 'Svenska' },
];

const selectedLocale = ref(locale.value);

// PrimeVue locale configurations
const primeLocales: Record<string, any> = {
  en: {
    startsWith: 'Starts with',
    contains: 'Contains',
    notContains: 'Not contains',
    endsWith: 'Ends with',
    equals: 'Equals',
    notEquals: 'Not equals',
    noFilter: 'No Filter',
    filter: 'Filter',
    lt: 'Less than',
    lte: 'Less than or equal to',
    gt: 'Greater than',
    gte: 'Greater than or equal to',
    dateIs: 'Date is',
    dateIsNot: 'Date is not',
    dateBefore: 'Date is before',
    dateAfter: 'Date is after',
    custom: 'Custom',
    clear: 'Clear',
    apply: 'Apply',
    matchAll: 'Match All',
    matchAny: 'Match Any',
    addRule: 'Add Rule',
    removeRule: 'Remove Rule',
    accept: 'Yes',
    reject: 'No',
    choose: 'Choose',
    upload: 'Upload',
    cancel: 'Cancel',
    dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    dayNamesMin: ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'],
    monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    today: 'Today',
    weekHeader: 'Wk',
    firstDayOfWeek: 0,
    dateFormat: 'mm/dd/yy',
    weak: 'Weak',
    medium: 'Medium',
    strong: 'Strong',
    passwordPrompt: 'Enter a password',
    emptyFilterMessage: 'No results found',
    emptyMessage: 'No available options'
  },
  sv: {
    startsWith: 'Börjar med',
    contains: 'Innehåller',
    notContains: 'Innehåller inte',
    endsWith: 'Slutar med',
    equals: 'Lika med',
    notEquals: 'Inte lika med',
    noFilter: 'Inget filter',
    filter: 'Filtrera',
    lt: 'Mindre än',
    lte: 'Mindre än eller lika med',
    gt: 'Större än',
    gte: 'Större än eller lika med',
    dateIs: 'Datum är',
    dateIsNot: 'Datum är inte',
    dateBefore: 'Datum är före',
    dateAfter: 'Datum är efter',
    custom: 'Anpassad',
    clear: 'Rensa',
    apply: 'Tillämpa',
    matchAll: 'Matcha alla',
    matchAny: 'Matcha något',
    addRule: 'Lägg till regel',
    removeRule: 'Ta bort regel',
    accept: 'Ja',
    reject: 'Nej',
    choose: 'Välj',
    upload: 'Ladda upp',
    cancel: 'Avbryt',
    dayNames: ['Söndag', 'Måndag', 'Tisdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lördag'],
    dayNamesShort: ['Sön', 'Mån', 'Tis', 'Ons', 'Tor', 'Fre', 'Lör'],
    dayNamesMin: ['Sö', 'Må', 'Ti', 'On', 'To', 'Fr', 'Lö'],
    monthNames: ['Januari', 'Februari', 'Mars', 'April', 'Maj', 'Juni', 'Juli', 'Augusti', 'September', 'Oktober', 'November', 'December'],
    monthNamesShort: ['Jan', 'Feb', 'Mar', 'Apr', 'Maj', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dec'],
    today: 'Idag',
    weekHeader: 'V',
    firstDayOfWeek: 1,
    dateFormat: 'yy-mm-dd',
    weak: 'Svag',
    medium: 'Medium',
    strong: 'Stark',
    passwordPrompt: 'Ange ett lösenord',
    emptyFilterMessage: 'Inga resultat hittades',
    emptyMessage: 'Inga tillgängliga alternativ'
  }
};

// Initialize PrimeVue locale on component load
if (primevue.config && primevue.config.locale) {
  primevue.config.locale = primeLocales[locale.value];
}

// Watch for external locale changes
watch(locale, (newLocale) => {
  selectedLocale.value = newLocale;
  updatePrimeVueLocale(newLocale);
});

function changeLanguage() {
  locale.value = selectedLocale.value;
  saveLocale(selectedLocale.value);
  updateHtmlLang(selectedLocale.value);
  updatePrimeVueLocale(selectedLocale.value);
}

function updatePrimeVueLocale(newLocale: string) {
  if (primevue.config && primevue.config.locale && primeLocales[newLocale]) {
    primevue.config.locale = primeLocales[newLocale];
  }
}
</script>

<style scoped>
.language-selector {
  display: flex;
  align-items: center;
}

.lang-dropdown {
  min-width: 80px;
}

.lang-value {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
</style>
