import { generate } from "otp-generator";

export const generateOTP = () => {
    return generate(6, {
        lowerCaseAlphabets: false,
        upperCaseAlphabets: false,
        specialChars: false
    })
}