//
//  ICMainNFCReaderInteractor.h
//  ICNFCCardReader
//
//  Created by Minh Minh iOS on 02/07/2021.
//  Copyright © 2021 Innovation Center - VNPT IT. All rights reserved.
//

#import <Foundation/Foundation.h>
#import "ICMainNFCReaderProtocols.h"

NS_ASSUME_NONNULL_BEGIN

@interface ICMainNFCReaderInteractor : NSObject<ICMainNFCReaderInteractorInputProtocol>

@property (nonatomic, weak, nullable) id<ICMainNFCReaderInteractorOutputProtocol> output;

@end

NS_ASSUME_NONNULL_END
