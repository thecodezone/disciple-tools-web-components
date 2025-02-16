import { html, css } from 'lit';
import { styleMap } from 'lit/directives/style-map.js';
import { msg } from '@lit/localize';
import DtFormBase from '../dt-form-base.js';
import '../../icons/dt-spinner.js';
import '../../icons/dt-checkmark.js';

export class DtMultiSelect extends DtFormBase {
  static get styles() {
    return [
      ...super.styles,
      css`
        :host {
          position: relative;
          font-family: Helvetica, Arial, sans-serif;
        }

        .input-group {
          color: var(--dt-multi-select-text-color, #0a0a0a);
          margin-bottom: 1rem;
        }
        .input-group.disabled input,
        .input-group.disabled .field-container {
          background-color: var(--disabled-color);
        }
        .input-group.disabled a,
        .input-group.disabled button {
          cursor: not-allowed;
          pointer-events: none;
        }
        .input-group.disabled *:hover {
          cursor: not-allowed;
        }

        .field-container {
          background-color: var(--dt-multi-select-background-color, #fefefe);
          border: 1px solid var(--dt-form-border-color, #cacaca);
          border-radius: 0;
          color: var(--dt-multi-select-text-color, #0a0a0a);
          font-size: 1rem;
          font-weight: 300;
          min-height: 2.5rem;
          line-height: 1.5;
          margin: 0;
          padding-top: calc(0.5rem - 0.375rem);
          padding-bottom: 0.5rem;
          padding-inline: 0.5rem 1.6rem;
          box-sizing: border-box;
          width: 100%;
          text-transform: none;
          display: flex;
          flex-wrap: wrap;
        }

        .field-container input,
        .field-container .selected-option {
          height: 1.25rem;
        }

        .selected-option {
          border: 1px solid var(--dt-multi-select-tag-border-color, #c2e0ff);
          background-color: var(
            --dt-multi-select-tag-background-color,
            #c2e0ff
          );

          display: flex;
          font-size: 0.875rem;
          position: relative;
          border-radius: 2px;
          margin-inline-end: 4px;
          margin-block-start: 0.375rem;
          box-sizing: border-box;
        }
        .selected-option > *:first-child {
          padding-inline-start: 4px;
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          --container-padding: calc(0.5rem + 1.6rem + 2px);
          --option-padding: 8px;
          --option-button: 20px;
          max-width: calc(
            var(--container-width) - var(--container-padding) -
              var(--option-padding) - var(--option-button)
          );
        }
        .selected-option * {
          align-self: center;
        }
        .selected-option button {
          background: transparent;
          outline: 0;
          border: 0;
          border-inline-start: 1px solid
            var(--dt-multi-select-tag-border-color, #c2e0ff);
          color: var(--dt-multi-select-text-color, #0a0a0a);
          margin-inline-start: 4px;
        }
        .selected-option button:hover {
          cursor: pointer;
        }

        .field-container input {
          background-color: var(--dt-form-background-color, #fff);
          color: var(--dt-form-text-color, #000);
          flex-grow: 1;
          min-width: 50px;
          border: 0;
          margin-block-start: 0.375rem;
        }
        .field-container input:focus,
        .field-container input:focus-visible,
        .field-container input:active {
          border: 0;
          outline: 0;
        }
        .field-container input::placeholder {
          color: var(--dt-text-placeholder-color, #999);
          opacity: 1;
        }

        /* === Options List === */
        .option-list {
          list-style: none;
          margin: 0;
          padding: 0;
          border: 1px solid var(--dt-form-border-color, #cacaca);
          background: var(--dt-form-background-color, #fefefe);
          z-index: 10;
          position: absolute;
          width: 100%;
          top: 0;
          left: 0;
          box-shadow: var(--shadow-1);
          max-height: 150px;
          overflow-y: scroll;
        }
        .option-list li {
          border-block-start: 1px solid var(--dt-form-border-color, #cacaca);
          outline: 0;
        }
        .option-list li div,
        .option-list li button {
          padding: 0.5rem 0.75rem;
          color: var(--dt-multi-select-text-color, #0a0a0a);
          font-weight: 100;
          font-size: 1rem;
          text-decoration: none;
          text-align: inherit;
        }
        .option-list li button {
          display: block;
          width: 100%;
          border: 0;
          background: transparent;
        }
        .option-list li button:hover,
        .option-list li button.active {
          cursor: pointer;
          background: var(--dt-multi-select-option-hover-background, #f5f5f5);
        }
      `,
    ];
  }

  static get properties() {
    return {
      ...super.properties,
      placeholder: { type: String },
      options: { type: Array },
      filteredOptions: { type: Array, state: true },
      value: {
        type: Array,
        reflect: true,
      },
      open: {
        type: Boolean,
        state: true,
      },
      query: {
        type: String,
        state: true,
      },
      activeIndex: {
        type: Number,
        state: true,
      },
      containerHeight: {
        type: Number,
        state: true,
      },
      onchange: { type: String },
    };
  }

  constructor() {
    super();
    this.activeIndex = -1;
    this.filteredOptions = [];
    this.detectTap = false;
  }

  updated() {
    this._scrollOptionListToActive();

    // set variable with width of container for truncating selected options via CSS
    const container = this.shadowRoot.querySelector('.input-group');
    const currentValue = container.style.getPropertyValue('--container-width');
    if (!currentValue && container.clientWidth > 0) {
      container.style.setProperty(
        '--container-width',
        `${container.clientWidth}px`
      );
    }
  }

  /**
   * When navigating via keyboard, keep active element within visible area of option list
   * @private
   */
  _scrollOptionListToActive() {
    const optionList = this.shadowRoot.querySelector('.option-list');
    const activeEl = this.shadowRoot.querySelector('button.active');
    if (optionList && activeEl) {
      const elTop = activeEl.offsetTop;
      const elBottom = activeEl.offsetTop + activeEl.clientHeight;
      const listTop = optionList.scrollTop;
      const listBottom = optionList.scrollTop + optionList.clientHeight;
      if (elBottom > listBottom) {
        // active element below visible area. scroll down
        optionList.scrollTo({
          top: elBottom - optionList.clientHeight,
          behavior: 'smooth',
        });
      } else if (elTop < listTop) {
        // active element above visible area. scroll up
        optionList.scrollTo({ top: elTop, behavior: 'smooth' });
      }
    }
  }

  _clickOption(e) {
    if (e.target && e.target.value) {
      this._select(e.target.value);
    }
  }

  _touchStart(e) {
    if (e.target) {
      this.detectTap = false;
    }
  }

  _touchMove(e) {
    if (e.target) {
      this.detectTap = true;
    }
  }

  _touchEnd(e) {
    if (!this.detectTap) {
      if (e.target && e.target.value) {
        this._clickOption(e);
      }
      this.detectTap = false;
    }
  }

  _keyboardSelectOption() {
    if (this.activeIndex > -1) {
      this._select(this.filteredOptions[this.activeIndex].id);
    }
  }

  _select(value) {
    // Create custom event with new/old values to pass to onchange function
    const event = new CustomEvent('change', {
      detail: {
        field: this.name,
        oldValue: this.value,
      },
    });

    // update value in this component
    if (this.value && this.value.length) {
      if (typeof this.value[0] === 'string') {
        // If value is array of strings, check for same value prefixed with hyphen
        this.value = [...this.value.filter(i => i !== `-${value}`), value];
      } else {
        // If value is array of objects, check for same value with `delete` property
        let foundPrevious = false;
        const newVal = this.value.map(i => {
          const val = {
            ...i,
          };
          if (i.id === value.id && i.delete) {
            delete val.delete;
            foundPrevious = true;
          }
          return val;
        });
        if (!foundPrevious) {
          newVal.push(value);
        }
        this.value = newVal;
      }
    } else {
      this.value = [value];
    }
    event.detail.newValue = this.value;
    this.open = false; // close options list
    this.activeIndex = -1; // reset keyboard-selected option

    // dispatch event for use with addEventListener from javascript
    this.dispatchEvent(event);
    this._setFormValue(this.value);
  }

  _remove(e) {
    if (e.target && e.target.dataset && e.target.dataset.value) {
      const event = new CustomEvent('change', {
        detail: {
          field: this.name,
          oldValue: this.value,
        },
      });
      this.value = (this.value || []).map(i =>
        i === e.target.dataset.value ? `-${i}` : i
      );
      event.detail.newValue = this.value;

      // dispatch event for use with addEventListener from javascript
      this.dispatchEvent(event);
      this._setFormValue(this.value);

      // If option was de-selected while list was open, re-focus input
      if (this.open) {
        this.shadowRoot.querySelector('input').focus();
      }
    }
  }

  static _focusInput(e) {
    if (e.target !== e.currentTarget) return;

    e.target.getElementsByTagName('input')[0].focus();
  }

  _inputFocusIn() {
    this.open = true;
    this.activeIndex = -1;
  }

  _inputFocusOut(e) {
    // allow clicks on option list button to not close the option list
    // Safari actually passes the parent <li> as the relatedTarget
    if (
      !e.relatedTarget ||
      !['BUTTON', 'LI'].includes(e.relatedTarget.nodeName)
    ) {
      this.open = false;
    }
  }

  _inputKeyDown(e) {
    const keycode = e.keyCode || e.which;

    switch (keycode) {
      case 8: // backspace
        if (e.target.value === '') {
          this.value = this.value.slice(0, -1);
        }
        break;
      case 38: // arrow up
        this.open = true;
        this._listHighlightPrevious();
        break;
      case 40: // arrow down
        this.open = true;
        this._listHighlightNext();
        break;
      case 9: // tab
        if (this.activeIndex < 0) {
          // if pressing tab while no option is selected,
          // close the list so you can go to next field
          this.open = false;
        } else {
          e.preventDefault();
        }
        this._keyboardSelectOption();
        break;
      case 13: // enter
        this._keyboardSelectOption();
        break;
      case 27: // escape
        this.open = false;
        this.activeIndex = -1;
        break;
      default:
        this.open = true;
        break;
    }
  }

  _inputKeyUp(e) {
    this.query = e.target.value;
  }

  _listHighlightNext() {
    this.activeIndex = Math.min(
      this.filteredOptions.length - 1,
      this.activeIndex + 1
    );
  }

  _listHighlightPrevious() {
    this.activeIndex = Math.max(0, this.activeIndex - 1);
  }

  /**
   * Filter to options that:
   *   1: are not selected
   *   2: match the search query
   * @private
   */
  _filterOptions() {
    this.filteredOptions = (this.options || []).filter(
      opt =>
        !(this.value || []).includes(opt.id) &&
        (!this.query ||
          opt.label
            .toLocaleLowerCase()
            .includes(this.query.toLocaleLowerCase()))
    );
    return this.filteredOptions;
  }

  willUpdate(props) {
    super.willUpdate(props);

    if (props) {
      const valueChanged = props.has('value');
      const queryChanged = props.has('query');
      const optionsChanged = props.has('options');

      // if value, query, or options change, trigger filter
      if (valueChanged || queryChanged || optionsChanged) {
        this._filterOptions();
      }

      // Set the containerHeight for dropdown positioning if it hasn't been set yet
      if (
        !this.containerHeight &&
        this.shadowRoot.children &&
        this.shadowRoot.children.length
      ) {
        const inputGroup = this.shadowRoot.querySelector('.input-group');
        if (inputGroup) {
          this.containerHeight =
            inputGroup.offsetHeight;
        }
      }
    }
  }

  _renderSelectedOptions() {
    return (
      this.options &&
      this.options
        .filter(opt => this.value && this.value.indexOf(opt.id) > -1)
        .map(
          opt => html`
            <div class="selected-option">
              <span>${opt.label}</span>
              <button
                @click="${this._remove}"
                ?disabled="${this.disabled}"
                data-value="${opt.id}"
              >
                x
              </button>
            </div>
          `
        )
    );
  }

  _renderOption(opt, idx) {
    return html`
      <li tabindex="-1">
        <button
          value="${opt.id}"
          type="button"
          data-label="${opt.label}"
          @click="${this._clickOption}"
          @touchstart="${this._touchStart}"
          @touchmove="${this._touchMove}"
          @touchend="${this._touchEnd}"
          tabindex="-1"
          class="${this.activeIndex > -1 && this.activeIndex === idx
            ? 'active'
            : ''}"
        >
          ${opt.label}
        </button>
      </li>
    `;
  }

  _renderOptions() {
    if (!this.filteredOptions.length) {
      return html`<li><div>${msg('No Data Available')}</div></li>`;
    }

    return this.filteredOptions.map((opt, idx) => this._renderOption(opt, idx));
  }

  render() {
    const optionListStyles = {
      display: this.open ? 'block' : 'none',
      top: this.containerHeight ? `${this.containerHeight}px` : '2.5rem',
    };
    return html`
      ${this.labelTemplate()}

      <div class="input-group ${this.disabled ? 'disabled' : ''}">
        <div
          class="field-container"
          @click="${this._focusInput}"
          @keydown="${this._focusInput}"
        >
          ${this._renderSelectedOptions()}
          <input
            type="text"
            placeholder="${this.placeholder}"
            @focusin="${this._inputFocusIn}"
            @blur="${this._inputFocusOut}"
            @keydown="${this._inputKeyDown}"
            @keyup="${this._inputKeyUp}"
            ?disabled="${this.disabled}"
          />
        </div>
        <ul class="option-list" style=${styleMap(optionListStyles)}>
          ${this._renderOptions()}
        </ul>
        ${this.loading
          ? html`<dt-spinner class="icon-overlay"></dt-spinner>`
          : null}
        ${this.saved
          ? html`<dt-checkmark class="icon-overlay success"></dt-checkmark>`
          : null}
        ${this.error
          ? html`<dt-icon
                icon="mdi:alert-circle"
                class="icon-overlay alert"
                tooltip="${this.error}"
                size="2rem"
                ></dt-icon>`
              : null}
        </div>
`;
  }
}

window.customElements.define('dt-multi-select', DtMultiSelect);
