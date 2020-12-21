import React, { Component } from "react";
import { Image, TextInput, TouchableWithoutFeedback, View, Text } from "react-native";
import PropTypes from "prop-types";

import Country from "./country";
import Flags from "./resources/flags";
import PhoneNumber from "./phoneNumber";
import styles from "./styles";
import CountryPicker from "./countryPicker";

export default class PhoneInput extends Component {
  static setCustomCountriesData(json) {
    Country.setCustomCountriesData(json);
  }

  constructor(props, context) {
    super(props, context);

    this.onChangePhoneNumber = this.onChangePhoneNumber.bind(this);
    this.onPressFlag = this.onPressFlag.bind(this);
    this.selectCountry = this.selectCountry.bind(this);
    this.getFlag = this.getFlag.bind(this);
    this.getISOCode = this.getISOCode.bind(this);
    this.isTelephoneNumber = this.isTelephoneNumber.bind(this);
    this.checkValidMobileNumber = this.checkValidMobileNumber.bind(this);

    const { countriesList, disabled, initialCountry } = this.props;

    if (countriesList) {
      Country.setCustomCountriesData(countriesList);
    }
    const countryData = PhoneNumber.getCountryDataByCode(initialCountry);

    this.state = {
      iso2: initialCountry,
      disabled,
      formattedNumber: countryData ? `+${countryData.dialCode}` : "",
      value: null
    };
  }

  componentDidMount() {
    if (this.props.value) {
      this.updateFlagAndFormatNumber(this.props.value);
    }
  }

    componentDidUpdate(prevProps) {
        if(prevProps.value != this.props.value){
            const { value } = this.props;
            if (value && value !== this.state.value) {
                this.setState({ value });
                this.updateFlagAndFormatNumber(value);
            }
        }
        if(prevProps.initialCountry != this.props.initialCountry){
          const countryData = PhoneNumber.getCountryDataByCode(this.props.initialCountry);
          const { initialCountry } = this.props;
          this.setState({ 
            iso2: initialCountry,
            formattedNumber: countryData ? `+${countryData.dialCode}` : ""
          })
        }
        if(prevProps.disabled != this.props.disabled){
            const { disabled } = this.props;
            this.setState({ disabled })
        }
        if(prevProps.focus != this.props.focus){
            this.props.focus && this.focus();
        }
    } 

  onChangePhoneNumber(number) {
    const actionAfterSetState = this.props.onChangePhoneNumber
      ? () => {
        this.props.onChangePhoneNumber(number);
      }
      : null;
    this.updateFlagAndFormatNumber(number, actionAfterSetState);
  }

  isTelephoneNumber(){
    return this.getNumberType()=='FIXED_LINE' ? true : false;
  }

  checkValidMobileNumber(){
    if(this.getNumberType()=='MOBILE' || this.getNumberType()=='FIXED_LINE_OR_MOBILE'){
     return 1; 
    }else if(this.getNumberType()=='UNKNOWN'){
      return -1;
    }
    return 0;
  }

  onPressFlag() {
    if (this.props.onPressFlag) {
      this.props.onPressFlag();
    } else {
      if (this.state.iso2) this.picker.selectCountry(this.state.iso2);
      this.picker.show();
    }
  }

  getPickerData() {
    return PhoneNumber.getAllCountries().map((country, index) => ({
      key: index,
      image: Flags.get(country.iso2),
      label: country.name,
      dialCode: `+${country.dialCode}`,
      iso2: country.iso2
    }));
  }

  getCountryCode() {
    const countryData = PhoneNumber.getCountryDataByCode(this.state.iso2);
    return countryData.dialCode;
  }

  getAllCountries() {
    return PhoneNumber.getAllCountries();
  }

  getFlag(iso2) {
    return Flags.get(iso2);
  }

  getDialCode() {
    return PhoneNumber.getDialCode(this.state.formattedNumber);
  }

  getValue() {
    return this.state.formattedNumber;
  }

  getNumberType() {
    return PhoneNumber.getNumberType(
      this.state.formattedNumber,
      this.state.iso2
    );
  }

  getISOCode() {
    return this.state.iso2;
  }

  selectCountry(iso2) {
    if (this.state.iso2 !== iso2) {
      const countryData = PhoneNumber.getCountryDataByCode(iso2);
      if (countryData) {
        const newPhoneNumber = this.state.formattedNumber.replace(
          PhoneNumber.getDialCode(this.state.formattedNumber),
          `+${countryData.dialCode}`
        )
        this.setState(
          {
            iso2,
            formattedNumber: newPhoneNumber
          },
          () => {
            this.updateFlagAndFormatNumber(newPhoneNumber)
            if (this.props.onSelectCountry) this.props.onSelectCountry(iso2);
          }
        );
      }
    }
  }

  isValidNumber() {
    if (this.state.formattedNumber.length < 3) return false;
    return PhoneNumber.isValidNumber(
      this.state.formattedNumber,
      this.state.iso2
    );
  }

  format(text) {
    return this.props.autoFormat
      ? PhoneNumber.format(text, this.state.iso2)
      : text;
  }

  updateFlagAndFormatNumber(number, actionAfterSetState = null) {
    const { allowZeroAfterCountryCode, initialCountry } = this.props;
    let iso2 = this.getISOCode() || initialCountry;
    let formattedPhoneNumber = number;
    if (number) {
      if (formattedPhoneNumber[0] !== "+") formattedPhoneNumber = `+${formattedPhoneNumber}`;
      formattedPhoneNumber = allowZeroAfterCountryCode
        ? formattedPhoneNumber
        : this.possiblyEliminateZeroAfterCountryCode(formattedPhoneNumber);
      iso2 = PhoneNumber.getCountryCodeOfNumber(formattedPhoneNumber);

      if( formattedPhoneNumber.includes(this.state.formattedNumber)){
        formattedPhoneNumber = this.format(formattedPhoneNumber)
      }
    }
    this.setState({ iso2, formattedNumber: formattedPhoneNumber }, actionAfterSetState);
  }

  possiblyEliminateZeroAfterCountryCode(number) {
    const dialCode = PhoneNumber.getDialCode(number);
    return number.startsWith(`${dialCode}0`)
      ? dialCode + number.substr(dialCode.length + 1)
      : number;
  }

  focus() {
    this.inputPhone.focus();
  }

  render() {
    const { iso2, formattedNumber, disabled } = this.state;
    const { focus, returnKey } = this.props;
    const TextComponent = this.props.textComponent || TextInput;
    return (
      < View style = { [styles.container, this.props.style]} >
        <TouchableWithoutFeedback
          onPress={this.onPressFlag}
          disabled={disabled}
          hitSlop={{top: 10, bottom: 10, right: 10}}
        >
        < View style={[this.props.flagContainer]} >
          <Image
            source={Flags.get(iso2)}
            style={[styles.flag, this.props.flagStyle]}
            onPress={this.onPressFlag}
          />
        </View>      
        </TouchableWithoutFeedback>
        <View style={[{ flex: 1, marginLeft: this.props.offset || 10,justifyContent:"center", flexDirection: 'column'},this.props.style]}>
          <TextComponent
            ref={ref => {
              this.inputPhone = ref;
            }}
            editable={!disabled}
            autoCorrect={false}
            style={[styles.text, this.props.textStyle]}
            onChangeText={text => {
              this.onChangePhoneNumber(text);
            }}
            autoFocus={focus}
            returnKeyType={returnKey ? 'done' : null}
            keyboardType="phone-pad"
            underlineColorAndroid="rgba(0,0,0,0)"
            value={formattedNumber}
            keyboardAppearance={this.props.keyboardAppearance}
            {...this.props.textProps}
          />
        </View>

        <CountryPicker
          ref={ref => {
            this.picker = ref;
          }}
          selectedCountry={iso2}
          onSubmit={this.selectCountry}
          buttonColor={this.props.pickerButtonColor}
          buttonTextStyle={this.props.pickerButtonTextStyle}
          itemStyle={this.props.itemStyle}
          cancelText={this.props.cancelText}
          cancelTextStyle={this.props.cancelTextStyle}
          confirmText={this.props.confirmText}
          confirmTextStyle={this.props.confirmTextStyle}
          pickerBackgroundColor={this.props.pickerBackgroundColor}
          itemStyle={this.props.pickerItemStyle}
        />
      </View>
    );
  }
}

PhoneInput.propTypes = {
  textComponent: PropTypes.func,
  initialCountry: PropTypes.string,
  onChangePhoneNumber: PropTypes.func,
  value: PropTypes.string,
  style: PropTypes.object,
  flagStyle: PropTypes.object,
  textStyle: PropTypes.object,
  offset: PropTypes.number,
  textProps: PropTypes.object,
  onSelectCountry: PropTypes.func,
  pickerButtonColor: PropTypes.string,
  pickerBackgroundColor: PropTypes.string,
  pickerItemStyle: PropTypes.object,
  countriesList: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string,
      iso2: PropTypes.string,
      dialCode: PropTypes.string,
      priority: PropTypes.number,
      areaCodes: PropTypes.arrayOf(PropTypes.string)
    })
  ),
  cancelText: PropTypes.string,
  cancelTextStyle: PropTypes.object,
  confirmText: PropTypes.string,
  confirmTextTextStyle: PropTypes.object,
  disabled: PropTypes.bool,
  allowZeroAfterCountryCode: PropTypes.bool,
  title: PropTypes.string,
  titleStyle:PropTypes.object,
};

PhoneInput.defaultProps = {
  initialCountry: "us",
  disabled: false,
  allowZeroAfterCountryCode: true
};
