//
//  ICNFCLocalizeHelper.h
//  ICNFCCardReader
//
//  Created by Minh Minh iOS on 04/07/2021.
//

#import <Foundation/Foundation.h>

NS_ASSUME_NONNULL_BEGIN

@interface ICNFCLocalizeHelper : NSObject

+ (ICNFCLocalizeHelper*) sharedLocalSystem;

// this gets the string localized:
- (NSString*) localizedStringForKey:(NSString*)key inputLanguage:(NSString*)inputLanguage;

@end

NS_ASSUME_NONNULL_END
